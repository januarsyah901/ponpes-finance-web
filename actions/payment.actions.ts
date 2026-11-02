'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  pembayaran,
  santri,
  komplek,
  kategori,
  auditLog,
  tagihan,
  alokasiPembayaran,
} from '@ponpes-finance/db/schema';
import {
  PaymentSubmitSchema,
  CashPaymentCreateSchema,
} from '@ponpes-finance/db/validators';
import { allocatePayment } from '@ponpes-finance/db';
import { eq, inArray, and, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak memiliki akses (Unauthorized)');
  }
  return session.user;
}

/**
 * 1. Submit Payment Action (invoked by Santri)
 */
export async function submitPaymentAction(data: unknown) {
  const user = await requireAuth();

  const parsed = PaymentSubmitSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Data pembayaran tidak valid',
    };
  }

  const { santriId, nominal, tanggalBayar, catatanSantri, buktiUrl } = parsed.data;

  // Santri Role Integrity: Santri can only submit payments for themselves
  if (user.role === 'santri' && user.santriId !== santriId) {
    return {
      success: false,
      error: 'Anda hanya dapat mengirim pembayaran untuk akun santri Anda sendiri',
    };
  }

  try {
    const [santriRecord] = await db
      .select({ id: santri.id, komplekId: santri.komplekId, status: santri.status })
      .from(santri)
      .where(eq(santri.id, santriId))
      .limit(1);

    if (!santriRecord) {
      return { success: false, error: 'Data santri tidak ditemukan' };
    }

    if (santriRecord.status !== 'aktif') {
      return {
        success: false,
        error: 'Santri dengan status boyong tidak dapat mengajukan pembayaran transfer baru',
      };
    }

    const [newPembayaran] = await db
      .insert(pembayaran)
      .values({
        santriId,
        komplekId: santriRecord.komplekId,
        metode: 'transfer',
        nominal,
        tanggalBayar,
        catatanSantri: catatanSantri || null,
        buktiUrl,
        status: 'menunggu_verifikasi',
      })
      .returning();

    revalidatePath('/santri');
    revalidatePath('/santri/bayar');
    revalidatePath('/santri/riwayat');
    revalidatePath('/bendahara/verifikasi');

    return { success: true, data: newPembayaran };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan pembayaran' };
  }
}

/**
 * 2. Verify Payment Action (invoked by Bendahara - Pathway 1 & 2)
 */
export async function verifyPaymentAction(input: {
  pembayaranId: string;
  nominalDiverifikasi?: number;
  alasanKoreksi?: string;
}) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Hanya bendahara yang berwenang memverifikasi pembayaran' };
  }

  try {
    const [existing] = await db
      .select()
      .from(pembayaran)
      .where(eq(pembayaran.id, input.pembayaranId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Data pembayaran tidak ditemukan' };
    }

    if (existing.status !== 'menunggu_verifikasi') {
      return { success: false, error: 'Hanya pembayaran dengan status menunggu verifikasi yang dapat diverifikasi' };
    }

    if (user.role === 'bendahara_komplek' && user.complexIds && !user.complexIds.includes('all')) {
      if (!user.complexIds.includes(existing.komplekId)) {
        return { success: false, error: 'Anda tidak memiliki hak akses verifikasi pada komplek ini' };
      }
    }

    if (input.nominalDiverifikasi !== undefined && input.nominalDiverifikasi !== existing.nominal) {
      if (!input.alasanKoreksi || input.alasanKoreksi.trim().length < 5) {
        return { success: false, error: 'Alasan penyesuaian nominal wajib diisi (minimal 5 karakter)' };
      }
    }

    const verifiedAmount = input.nominalDiverifikasi ?? existing.nominal;

    if (verifiedAmount <= 0) {
      return { success: false, error: 'Nominal verifikasi harus lebih besar dari Rp 0' };
    }

    // Call atomic allocatePayment engine
    const allocationResult = await allocatePayment(db, {
      pembayaranId: existing.id,
      santriId: existing.santriId,
      nominal: verifiedAmount,
      metode: existing.metode,
      tanggalBayar: existing.tanggalBayar,
      adminUserId: user.id,
      catatan: input.alasanKoreksi
        ? `Disesuaikan oleh bendahara: ${input.alasanKoreksi}`
        : existing.catatanSantri || undefined,
    });

    revalidatePath('/bendahara/verifikasi');
    revalidatePath('/bendahara');
    revalidatePath('/bendahara/tagihan');
    revalidatePath('/santri');
    revalidatePath('/santri/bayar');

    return { success: true, data: allocationResult };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memverifikasi pembayaran' };
  }
}

/**
 * 3. Reject Payment Action (invoked by Bendahara - Pathway 3)
 */
export async function rejectPaymentAction(input: {
  pembayaranId: string;
  alasanPenolakan: string;
}) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Hanya bendahara yang berwenang menolak pembayaran' };
  }

  if (!input.alasanPenolakan || input.alasanPenolakan.trim().length < 5) {
    return { success: false, error: 'Alasan penolakan wajib diisi minimal 5 karakter' };
  }

  try {
    const [existing] = await db
      .select()
      .from(pembayaran)
      .where(eq(pembayaran.id, input.pembayaranId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Data pembayaran tidak ditemukan' };
    }

    if (existing.status === 'terverifikasi') {
      return { success: false, error: 'Pembayaran yang sudah diverifikasi tidak dapat ditolak (gunakan reversal)' };
    }

    if (user.role === 'bendahara_komplek' && user.complexIds && !user.complexIds.includes('all')) {
      if (!user.complexIds.includes(existing.komplekId)) {
        return { success: false, error: 'Anda tidak memiliki hak akses verifikasi pada komplek ini' };
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(pembayaran)
        .set({
          status: 'ditolak',
          alasanPenolakan: input.alasanPenolakan.trim(),
          diverifikasiOlehId: user.id,
          diverifikasiPada: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pembayaran.id, existing.id));

      await tx.insert(auditLog).values({
        userId: user.id,
        action: 'verifikasi_pembayaran_tolak',
        entityType: 'pembayaran',
        entityId: existing.id,
        newValues: {
          santriId: existing.santriId,
          nominal: existing.nominal,
          alasanPenolakan: input.alasanPenolakan.trim(),
        },
      });
    });

    revalidatePath('/bendahara/verifikasi');
    revalidatePath('/santri/bayar');
    revalidatePath('/santri');

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menolak pembayaran' };
  }
}

/**
 * 4. Process Cash Payment Intake (Cash Desk)
 */
export async function processCashPaymentAction(data: unknown) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Hanya bendahara yang berwenang mencatat pembayaran kas' };
  }

  const parsed = CashPaymentCreateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Data pembayaran tunai tidak valid',
    };
  }

  const { santriId, nominal, tanggalBayar, catatan } = parsed.data;

  try {
    const [santriData] = await db
      .select({
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        komplekId: santri.komplekId,
        komplekKode: komplek.kode,
        komplekNama: komplek.nama,
        kategoriNama: kategori.nama,
        nomorWhatsapp: santri.nomorWhatsapp,
      })
      .from(santri)
      .innerJoin(komplek, eq(santri.komplekId, komplek.id))
      .innerJoin(kategori, eq(santri.kategoriId, kategori.id))
      .where(eq(santri.id, santriId))
      .limit(1);

    if (!santriData) {
      return { success: false, error: 'Data santri tidak ditemukan' };
    }

    if (user.role === 'bendahara_komplek' && user.complexIds && !user.complexIds.includes('all')) {
      if (!user.complexIds.includes(santriData.komplekId)) {
        return { success: false, error: 'Akses ditolak: Anda tidak memiliki wewenang kas untuk komplek santri ini' };
      }
    }

    const allocationResult = await allocatePayment(db, {
      santriId,
      nominal,
      metode: 'tunai',
      tanggalBayar,
      catatan,
      adminUserId: user.id,
      isCashDesk: true,
    });

    // Query remaining total unpaid debt for santri
    const [debtResult] = await db
      .select({
        totalDebt: sql<number>`COALESCE(SUM(${tagihan.sisa}), 0)::int`,
      })
      .from(tagihan)
      .where(
        and(
          eq(tagihan.santriId, santriId),
          inArray(tagihan.status, ['belum_bayar', 'sebagian'])
        )
      );

    const receipt = {
      pembayaranId: allocationResult.pembayaranId,
      nomorKuitansi: `KAS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${allocationResult.pembayaranId.slice(0, 6).toUpperCase()}`,
      tanggalBayar,
      santri: santriData,
      nominalTotal: nominal,
      totalAlokasiTabungan: allocationResult.totalTabungan,
      totalAlokasiOperasional: allocationResult.totalOperasional,
      sisaTunggakanSetelahBayar: debtResult?.totalDebt || 0,
      alokasiRincian: allocationResult.allocatedBills,
      catatan,
      petugasNama: user.nama || user.username,
    };

    revalidatePath('/bendahara/kas');
    revalidatePath('/bendahara');
    revalidatePath('/bendahara/tagihan');
    revalidatePath('/santri');

    return { success: true, data: receipt };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memproses pembayaran kas' };
  }
}
