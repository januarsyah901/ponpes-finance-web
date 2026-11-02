'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { aturanSubsidi } from '@ponpes-finance/db/schema';
import {
  previewSubsidyApplication,
  executeSubsidyApplication,
} from '@ponpes-finance/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const SubsidyRuleCreateActionSchema = z.object({
  nama: z.string().min(3, 'Nama aturan subsidi wajib diisi minimal 3 karakter'),
  nominal: z.number().int().positive('Nominal subsidi harus lebih besar dari Rp 0'),
  tagihanKegiatanId: z.string().uuid().optional().nullable(),
  syaratJson: z.object({
    komplekIds: z.array(z.string().uuid()).optional(),
    kategoriIds: z.array(z.string().uuid()).optional(),
    minTagihanTertunggak: z.number().int().nonnegative().optional(),
    maxSaldoTabungan: z.number().int().nonnegative().optional(),
    minLamaMondokBulan: z.number().int().nonnegative().optional(),
    syahriahLunasSampai: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    cakupan: z.enum(['nominal_tetap', 'lunas_penuh']).optional().default('nominal_tetap'),
    sumberDana: z.enum(['bantuan_langsung', 'potong_tabungan']).optional().default('bantuan_langsung'),
    tipeTarget: z.enum(['syahriah', 'kegiatan']).optional().default('syahriah'),
  }),
});
export type SubsidyRuleCreateActionInput = z.infer<typeof SubsidyRuleCreateActionSchema>;

export const ExecuteSubsidyActionSchema = z.object({
  ruleId: z.string().uuid('ID aturan tidak valid'),
  selectedSantriIds: z.array(z.string().uuid()).min(1, 'Pilih minimal 1 santri penerima subsidi'),
  bulan: z.number().int().min(1).max(12).optional(),
  tahun: z.number().int().min(2020).max(2050).optional(),
  catatan: z.string().optional(),
});
export type ExecuteSubsidyActionInput = z.infer<typeof ExecuteSubsidyActionSchema>;

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
 * 1. Create Subsidy Rule
 */
export async function createSubsidyRuleAction(data: unknown) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Hanya bendahara atau super admin yang berwenang membuat aturan subsidi' };
  }

  const parsed = SubsidyRuleCreateActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Input aturan subsidi tidak valid' };
  }

  const { nama, nominal, tagihanKegiatanId, syaratJson } = parsed.data;

  try {
    const [newRule] = await db
      .insert(aturanSubsidi)
      .values({
        nama,
        nominal,
        tagihanKegiatanId: tagihanKegiatanId || null,
        syaratJson,
        isActive: true,
        dibuatOlehId: user.id,
      })
      .returning();

    revalidatePath('/bendahara/subsidi');
    return { success: true, data: newRule };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan aturan subsidi' };
  }
}

/**
 * 2. Stage 1: Preview Dry-Run Subsidy Application
 * Pure read-only computation without database modifications.
 */
export async function previewSubsidyRuleAction(ruleId: string, options?: { bulan?: number; tahun?: number; komplekId?: string }) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Tidak memiliki wewenang simulasi subsidi' };
  }

  try {
    const preview = await previewSubsidyApplication(db, {
      aturanId: ruleId,
      bulan: options?.bulan,
      tahun: options?.tahun,
      komplekId: options?.komplekId,
    });

    return {
      success: true,
      data: preview,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghitung simulasi subsidi' };
  }
}

/**
 * 3. Stage 2: Atomic Execution of Subsidy Application
 * Runs in ACID transaction with row-level locking.
 */
export async function executeSubsidyRuleAction(data: unknown) {
  const user = await requireAuth();

  if (user.role !== 'bendahara_komplek' && user.role !== 'super_admin') {
    return { success: false, error: 'Hanya bendahara yang berwenang mengeksekusi penyaluran subsidi' };
  }

  const parsed = ExecuteSubsidyActionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Parameter eksekusi tidak valid' };
  }

  const { ruleId, selectedSantriIds, bulan, tahun } = parsed.data;

  try {
    const result = await executeSubsidyApplication(db, {
      aturanId: ruleId,
      bulan,
      tahun,
      adminUserId: user.id,
      selectedSantriIds,
    });

    revalidatePath('/bendahara/subsidi');
    revalidatePath('/bendahara/tagihan');
    revalidatePath('/bendahara/tabungan');
    revalidatePath('/santri/tabungan');

    return {
      success: true,
      data: result,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengeksekusi subsidi' };
  }
}
