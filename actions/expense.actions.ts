'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  createPengeluaran,
  cancelPengeluaran,
  listPengeluaran,
  listKategoriPengeluaran,
  createKategoriPengeluaran,
} from '@ponpes-finance/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const CreateExpenseSchema = z.object({
  komplekId: z.string().uuid('Komplek wajib dipilih'),
  kategoriPengeluaranId: z.string().uuid('Kategori wajib dipilih'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  nominal: z.number().int().positive('Nominal harus lebih dari 0'),
  keterangan: z.string().min(3, 'Keterangan minimal 3 karakter'),
  buktiUrl: z.string().optional().nullable(),
});

export const CancelExpenseSchema = z.object({
  pengeluaranId: z.string().uuid('ID pengeluaran tidak valid'),
  alasanBatal: z.string().min(5, 'Alasan pembatalan minimal 5 karakter'),
});

async function requireBendaharaAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak terautentikasi');
  }
  if (session.user.role !== 'bendahara_komplek' && session.user.role !== 'super_admin') {
    throw new Error('Hanya bendahara yang berhak mengakses');
  }
  return session.user;
}

export async function createExpenseAction(data: unknown) {
  const user = await requireBendaharaAuth();
  const parsed = CreateExpenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Data tidak valid' };
  }

  try {
    const expense = await createPengeluaran(db, {
      ...parsed.data,
      dibuatOlehId: user.id,
    });
    revalidatePath('/bendahara/pengeluaran');
    revalidatePath('/bendahara/laporan');
    return { success: true, data: expense };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan pengeluaran' };
  }
}

export async function cancelExpenseAction(data: unknown) {
  const user = await requireBendaharaAuth();
  const parsed = CancelExpenseSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Data tidak valid' };
  }

  try {
    const cancelled = await cancelPengeluaran(db, {
      ...parsed.data,
      dibatalkanOlehId: user.id,
    });
    revalidatePath('/bendahara/pengeluaran');
    revalidatePath('/bendahara/laporan');
    return { success: true, data: cancelled };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membatalkan pengeluaran' };
  }
}

export async function listExpensesAction(filter?: {
  komplekId?: string;
  startDate?: string;
  endDate?: string;
  kategoriId?: string;
}) {
  await requireBendaharaAuth();
  try {
    const list = await listPengeluaran(db, filter);
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memuat pengeluaran' };
  }
}

export async function listExpenseCategoriesAction() {
  await requireBendaharaAuth();
  try {
    const categories = await listKategoriPengeluaran(db);
    return { success: true, data: categories };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memuat kategori' };
  }
}

export async function createExpenseCategoryAction(nama: string, deskripsi?: string) {
  await requireBendaharaAuth();
  if (!nama || nama.trim().length < 2) {
    return { success: false, error: 'Nama kategori minimal 2 karakter' };
  }
  try {
    const cat = await createKategoriPengeluaran(db, { nama, deskripsi });
    revalidatePath('/bendahara/pengeluaran');
    return { success: true, data: cat };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membuat kategori' };
  }
}
