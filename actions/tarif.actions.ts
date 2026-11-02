'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { komplek, kategori, tarifSyahriah } from '@ponpes-finance/db/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { TarifUpdateSchema } from '@ponpes-finance/db/validators';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak memiliki akses (Unauthorized)');
  }
  return session.user;
}

export async function getTarifMatrix() {
  try {
    await requireAuth();

    const complexes = await db.select().from(komplek).orderBy(komplek.kode);
    const categories = await db.select().from(kategori).orderBy(kategori.nama);
    const activeRates = await db
      .select()
      .from(tarifSyahriah)
      .where(eq(tarifSyahriah.isActive, true));

    return {
      complexes,
      categories,
      rates: activeRates,
    };
  } catch {
    return {
      complexes: [],
      categories: [],
      rates: [],
    };
  }
}

export async function updateTarifAction(data: unknown) {
  const user = await requireAuth();

  if (user.role !== 'super_admin' && user.role !== 'bendahara_komplek') {
    return { success: false, error: 'Akses ditolak' };
  }

  const parsed = TarifUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Data tarif tidak valid' };
  }

  const { komplekId, kategoriId, nominal, berlakuMulai } = parsed.data;

  // Invariant check: minimum nominal 50.000
  if (nominal < 50000) {
    return { success: false, error: 'Nominal syahriah minimal Rp50.000 untuk alokasi tabungan santri' };
  }

  const alokasiTabungan = 50000;
  const alokasiOperasional = nominal - 50000;

  try {
    // 1. Find existing active rate for this complex & category
    const [existing] = await db
      .select()
      .from(tarifSyahriah)
      .where(
        and(
          eq(tarifSyahriah.komplekId, komplekId),
          eq(tarifSyahriah.kategoriId, kategoriId),
          eq(tarifSyahriah.isActive, true)
        )
      )
      .limit(1);

    if (existing) {
      // Deactivate existing rate record
      await db
        .update(tarifSyahriah)
        .set({
          berlakuSampai: berlakuMulai,
          isActive: false,
        })
        .where(eq(tarifSyahriah.id, existing.id));
    }

    // 2. Insert new active rate record
    const [newRate] = await db
      .insert(tarifSyahriah)
      .values({
        komplekId,
        kategoriId,
        nominal,
        alokasiTabungan,
        alokasiOperasional,
        berlakuMulai,
        berlakuSampai: null,
        isActive: true,
      })
      .returning();

    revalidatePath('/master/tarif');
    return { success: true, data: newRate };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memperbarui tarif syahriah' };
  }
}
