'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  santri,
  komplek,
  ledgerTabungan,
  auditLog,
} from '@ponpes-finance/db/schema';
import {
  recordSavingsWithdrawal,
  recordSavingsInitialBalance,
  payEventBillFromSavings,
  getSantriSavingsBalance,
} from '@ponpes-finance/db';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const ManualDepositSchema = z.object({
  santriId: z.string().uuid('ID santri tidak valid'),
  nominal: z.number().int().positive('Nominal setoran harus lebih besar dari Rp 0'),
  jenisMutasi: z.enum(['saldo_awal', 'koreksi']),
  keterangan: z.string().min(5, 'Keterangan setoran wajib diisi minimal 5 karakter'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
});
export type ManualDepositInput = z.infer<typeof ManualDepositSchema>;

export const SavingsWithdrawalActionSchema = z.object({
  santriId: z.string().uuid('ID santri tidak valid'),
  nominal: z.number().int().positive('Nominal penarikan harus lebih besar dari Rp 0'),
  jenisMutasi: z.enum(['penarikan_boyong', 'penarikan_mendesak', 'pemakaian_kegiatan']),
  alasan: z.string().min(5, 'Alasan penarikan wajib diisi dengan jelas (minimal 5 karakter)'),
  diserahkanKepada: z.string().min(3, 'Nama penerima dana wajib diisi'),
  ubahStatusBoyong: z.boolean().optional().default(false),
});
export type SavingsWithdrawalActionInput = z.infer<typeof SavingsWithdrawalActionSchema>;

export const EmergencyWithdrawalRequestSchema = z.object({
  nominal: z.number().int().positive('Nominal penarikan harus lebih besar dari Rp 0'),
  alasan: z.string().min(5, 'Alasan permohonan darurat wajib diisi minimal 5 karakter'),
  nomorKontak: z.string().min(9, 'Nomor kontak tidak valid'),
});
export type EmergencyWithdrawalRequestInput = z.infer<typeof EmergencyWithdrawalRequestSchema>;

export const PayEventBillFromSavingsActionSchema = z.object({
  santriId: z.string().uuid('ID santri tidak valid'),
  tagihanId: z.string().uuid('ID tagihan tidak valid'),
  nominal: z.number().int().positive('Nominal pembayaran harus lebih dari 0').optional(),
  catatan: z.string().max(255).optional(),
});
export type PayEventBillFromSavingsActionInput = z.infer<typeof PayEventBillFromSavingsActionSchema>;

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak memiliki akses (Unauthorized)');
  }
  return session.user;
}

// ==========================================
// SERVER ACTIONS
// ==========================================

/**
 * 1. Record Manual Deposit / Initial Balance (by Bendahara)
 */
export async function recordManualDepositAction(data: unknown) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Hanya bendahara yang berwenang mencatat setoran / saldo awal' };
  }

  const parsed = ManualDepositSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Input setoran tidak valid' };
  }

  const { santriId, nominal, jenisMutasi, keterangan, tanggal } = parsed.data;

  try {
    const [santriData] = await db
      .select({ id: santri.id, komplekId: santri.komplekId })
      .from(santri)
      .where(eq(santri.id, santriId))
      .limit(1);

    if (!santriData) {
      return { success: false, error: 'Santri tidak ditemukan' };
    }

    if (user.role === 'bendahara_komplek' && user.complexIds && !user.complexIds.includes('all')) {
      if (!user.complexIds.includes(santriData.komplekId)) {
        return { success: false, error: 'Akses ditolak: Anda tidak memiliki wewenang untuk komplek santri ini' };
      }
    }

    if (jenisMutasi === 'saldo_awal') {
      await recordSavingsInitialBalance(db, {
        santriId,
        nominal,
        keterangan,
        adminId: user.id,
        tanggal,
      });
    } else {
      await db.transaction(async (tx) => {
        // Pessimistic row locking on santri
        await tx.select().from(santri).where(eq(santri.id, santriId)).for('update');

        const [newLedgerEntry] = await tx
          .insert(ledgerTabungan)
          .values({
            santriId,
            jenisMutasi: 'koreksi',
            nominal,
            referensiTipe: 'manual_deposit',
            keterangan,
            dibuatOlehId: user.id,
            disetujuiOlehId: user.id,
            createdAt: new Date(`${tanggal}T12:00:00Z`),
          })
          .returning();

        await tx.insert(auditLog).values({
          userId: user.id,
          action: 'tabungan_koreksi',
          entityType: 'ledger_tabungan',
          entityId: newLedgerEntry.id,
          newValues: {
            santriId,
            nominal,
            keterangan,
            tanggal,
          },
        });
      });
    }

    revalidatePath('/bendahara/tabungan');
    revalidatePath('/bendahara');
    revalidatePath('/santri/tabungan');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan mutasi tabungan' };
  }
}

/**
 * 2. Process Savings Withdrawal (by Bendahara)
 * Enforces: Derived Balance >= Nominal (SUM(nominal) >= 0)
 */
export async function processSavingsWithdrawalAction(data: unknown) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Hanya bendahara yang berwenang memproses penarikan tabungan' };
  }

  const parsed = SavingsWithdrawalActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Input penarikan tidak valid' };
  }

  const { santriId, nominal, jenisMutasi, alasan, diserahkanKepada, ubahStatusBoyong } = parsed.data;

  try {
    const [santriData] = await db
      .select({ id: santri.id, komplekId: santri.komplekId, nama: santri.nama, status: santri.status })
      .from(santri)
      .where(eq(santri.id, santriId))
      .limit(1);

    if (!santriData) {
      return { success: false, error: 'Santri tidak ditemukan' };
    }

    if (user.role === 'bendahara_komplek' && user.complexIds && !user.complexIds.includes('all')) {
      if (!user.complexIds.includes(santriData.komplekId)) {
        return { success: false, error: 'Akses ditolak: Anda tidak memiliki wewenang untuk komplek santri ini' };
      }
    }

    const memo = `${alasan} (Diserahkan kepada: ${diserahkanKepada})`;
    const targetJenis = jenisMutasi === 'penarikan_boyong' || ubahStatusBoyong ? 'penarikan_boyong' : 'penarikan_mendesak';

    await recordSavingsWithdrawal(db, {
      santriId,
      nominal,
      jenis: targetJenis,
      alasan: memo,
      adminId: user.id,
    });

    revalidatePath('/bendahara/tabungan');
    revalidatePath('/bendahara');
    revalidatePath('/santri/tabungan');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memproses penarikan dana tabungan' };
  }
}

/**
 * 3. Request Emergency Withdrawal (by Santri)
 */
export async function requestEmergencyWithdrawalAction(data: unknown) {
  const user = await requireAuth();

  if (user.role !== 'santri' || !user.santriId) {
    return { success: false, error: 'Hanya santri terdaftar yang dapat mengajukan penarikan mendesak' };
  }

  const parsed = EmergencyWithdrawalRequestSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Input permohonan tidak valid' };
  }

  const { nominal, alasan, nomorKontak } = parsed.data;
  const santriId = user.santriId;

  try {
    const currentBalance = await getSantriSavingsBalance(santriId, db);

    if (currentBalance < nominal) {
      return {
        success: false,
        error: `Nominal pengajuan (Rp ${nominal.toLocaleString('id-ID')}) melebihi saldo tabungan Anda (Rp ${currentBalance.toLocaleString('id-ID')})`,
      };
    }

    // Record request into auditLog for bendahara review
    await db.insert(auditLog).values({
      userId: user.id,
      action: 'pengajuan_penarikan_mendesak',
      entityType: 'santri',
      entityId: santriId,
      newValues: {
        santriId,
        nominal,
        alasan,
        nomorKontak,
        saldoSaatPengajuan: currentBalance,
        status: 'diajukan',
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengirim permohonan penarikan' };
  }
}

/**
 * 4. Pay Event Bill from Savings (by Santri or Bendahara)
 */
export async function payEventBillFromSavingsAction(data: unknown) {
  const user = await requireAuth();

  const parsed = PayEventBillFromSavingsActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Input pembayaran tidak valid' };
  }

  const { santriId, tagihanId, nominal, catatan } = parsed.data;

  // Santri can only pay for their own bills
  if (user.role === 'santri' && user.santriId !== santriId) {
    return { success: false, error: 'Akses ditolak: Anda hanya dapat membayar tagihan akun Anda sendiri' };
  }

  try {
    const result = await payEventBillFromSavings(db, {
      santriId,
      tagihanId,
      nominal,
      adminId: user.id,
      catatan,
    });

    revalidatePath('/santri/tabungan');
    revalidatePath('/santri/tagihan');
    revalidatePath('/bendahara/tabungan');

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membayar tagihan kegiatan dari tabungan' };
  }
}
