'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { komplek, kategori, santri, pengguna, ledgerTabungan, tagihan } from '@ponpes-finance/db/schema';
import { eq, inArray, and, count, sql, desc } from 'drizzle-orm';
import { KomplekSchema, SantriCreateSchema, SantriUpdateSchema } from '@ponpes-finance/db/validators';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Helper to check user authorization
async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak memiliki akses (Unauthorized)');
  }
  return session.user;
}

// 1. COMPLEXES
export async function getKomplekList() {
  try {
    const user = await requireAuth();

    const query = db
      .select({
        id: komplek.id,
        kode: komplek.kode,
        nama: komplek.nama,
        jenis: komplek.jenis,
        deskripsi: komplek.deskripsi,
        createdAt: komplek.createdAt,
        updatedAt: komplek.updatedAt,
        santriCount: count(santri.id),
      })
      .from(komplek)
      .leftJoin(santri, eq(komplek.id, santri.komplekId))
      .groupBy(komplek.id)
      .orderBy(komplek.kode);

    if (user.role === 'bendahara_komplek' && !user.complexIds.includes('all')) {
      return await query.where(inArray(komplek.id, user.complexIds));
    }

    return await query;
  } catch {
    return [];
  }
}

export async function createKomplekAction(data: unknown) {
  const user = await requireAuth();
  if (user.role !== 'super_admin') {
    return { success: false, error: 'Hanya Super Admin yang dapat menambahkan komplek baru' };
  }

  const parsed = KomplekSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Data komplek tidak valid' };
  }

  try {
    const [inserted] = await db.insert(komplek).values({
      kode: parsed.data.kode.toUpperCase(),
      nama: parsed.data.nama,
      jenis: parsed.data.jenis,
      deskripsi: parsed.data.deskripsi,
    }).returning();

    revalidatePath('/master/komplek');
    return { success: true, data: inserted };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menambahkan komplek' };
  }
}

// 2. CATEGORIES
export async function getKategoriList() {
  try {
    await requireAuth();

    return await db
      .select({
        id: kategori.id,
        kode: kategori.kode,
        nama: kategori.nama,
        deskripsi: kategori.deskripsi,
        santriCount: count(santri.id),
      })
      .from(kategori)
      .leftJoin(santri, eq(kategori.id, santri.kategoriId))
      .groupBy(kategori.id)
      .orderBy(kategori.nama);
  } catch {
    return [];
  }
}

// 3. SANTRI PROFILES
export async function getSantriList(filters?: {
  komplekId?: string;
  kategoriId?: string;
  status?: 'aktif' | 'boyong';
  search?: string;
}) {
  try {
    const user = await requireAuth();

    const baseQuery = db
      .select({
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        komplekId: santri.komplekId,
        komplekKode: komplek.kode,
        komplekNama: komplek.nama,
        kategoriId: santri.kategoriId,
        kategoriKode: kategori.kode,
        kategoriNama: kategori.nama,
        tanggalMasuk: santri.tanggalMasuk,
        status: santri.status,
        nomorWhatsapp: santri.nomorWhatsapp,
        namaWali: santri.namaWali,
        nomorWhatsappWali: santri.nomorWhatsappWali,
        alamat: santri.alamat,
        terakhirDiingatkan: santri.terakhirDiingatkan,
        createdAt: santri.createdAt,
      })
      .from(santri)
      .innerJoin(komplek, eq(santri.komplekId, komplek.id))
      .innerJoin(kategori, eq(santri.kategoriId, kategori.id));

    const conditions = [];

    // Scoped multi-complex authorization
    if (user.role === 'bendahara_komplek' && !user.complexIds.includes('all')) {
      conditions.push(inArray(santri.komplekId, user.complexIds));
    }

    if (filters?.komplekId) {
      conditions.push(eq(santri.komplekId, filters.komplekId));
    }
    if (filters?.kategoriId) {
      conditions.push(eq(santri.kategoriId, filters.kategoriId));
    }
    if (filters?.status) {
      conditions.push(eq(santri.status, filters.status));
    }

    if (conditions.length > 0) {
      baseQuery.where(and(...conditions));
    }

    return await baseQuery.orderBy(desc(santri.createdAt));
  } catch {
    return [];
  }
}

export async function createSantriAction(data: unknown) {
  const user = await requireAuth();

  const parsed = SantriCreateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Data santri tidak valid' };
  }

  // Scoped authorization check for bendahara
  if (user.role === 'bendahara_komplek' && !user.complexIds.includes('all')) {
    if (!user.complexIds.includes(parsed.data.komplekId)) {
      return { success: false, error: 'Anda tidak memiliki hak akses untuk mendaftarkan santri di komplek ini' };
    }
  }

  try {
    // 1. Check duplicate NIS
    const [existing] = await db
      .select({ id: santri.id })
      .from(santri)
      .where(eq(santri.nis, parsed.data.nis.trim()))
      .limit(1);

    if (existing) {
      return { success: false, error: `NIS ${parsed.data.nis} sudah terdaftar di sistem` };
    }

    // 2. Insert Santri
    const [newSantri] = await db.insert(santri).values({
      nis: parsed.data.nis.trim(),
      nama: parsed.data.nama.trim(),
      komplekId: parsed.data.komplekId,
      kategoriId: parsed.data.kategoriId,
      tanggalMasuk: parsed.data.tanggalMasuk,
      status: parsed.data.status,
      nomorWhatsapp: parsed.data.nomorWhatsapp.trim(),
      namaWali: parsed.data.namaWali?.trim() || null,
      nomorWhatsappWali: parsed.data.nomorWhatsappWali?.trim() || null,
      alamat: parsed.data.alamat?.trim() || null,
    }).returning();

    // 3. Provision login account in pengguna
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    await db.insert(pengguna).values({
      username: newSantri.nis,
      passwordHash,
      nama: newSantri.nama,
      role: 'santri',
      isFirstLogin: true,
      isActive: true,
      santriId: newSantri.id,
    });

    // 4. If opening balance provided, insert into ledger_tabungan
    if (parsed.data.saldoAwalTabungan && parsed.data.saldoAwalTabungan > 0) {
      await db.insert(ledgerTabungan).values({
        santriId: newSantri.id,
        jenisMutasi: 'saldo_awal',
        nominal: parsed.data.saldoAwalTabungan,
        referensiTipe: 'saldo_pembuka',
        keterangan: 'Saldo tabungan awal saat pendaftaran',
        dibuatOlehId: user.id,
      });
    }

    revalidatePath('/master/santri');
    return { success: true, data: newSantri };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan data santri' };
  }
}

export async function updateSantriAction(data: unknown) {
  const user = await requireAuth();

  const parsed = SantriUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Data santri tidak valid' };
  }

  try {
    const [existing] = await db
      .select()
      .from(santri)
      .where(eq(santri.id, parsed.data.id))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Santri tidak ditemukan' };
    }

    // Scoped authorization check for bendahara
    if (user.role === 'bendahara_komplek' && !user.complexIds.includes('all')) {
      if (!user.complexIds.includes(existing.komplekId)) {
        return { success: false, error: 'Anda tidak memiliki hak akses untuk mengedit santri di komplek ini' };
      }
    }

    const [updated] = await db
      .update(santri)
      .set({
        nama: parsed.data.nama !== undefined ? parsed.data.nama.trim() : existing.nama,
        komplekId: parsed.data.komplekId || existing.komplekId,
        kategoriId: parsed.data.kategoriId || existing.kategoriId,
        tanggalMasuk: parsed.data.tanggalMasuk || existing.tanggalMasuk,
        status: parsed.data.status || existing.status,
        nomorWhatsapp: parsed.data.nomorWhatsapp !== undefined ? parsed.data.nomorWhatsapp.trim() : existing.nomorWhatsapp,
        namaWali: parsed.data.namaWali !== undefined ? parsed.data.namaWali?.trim() : existing.namaWali,
        nomorWhatsappWali: parsed.data.nomorWhatsappWali !== undefined ? parsed.data.nomorWhatsappWali?.trim() : existing.nomorWhatsappWali,
        alamat: parsed.data.alamat !== undefined ? parsed.data.alamat?.trim() : existing.alamat,
        updatedAt: new Date(),
      })
      .where(eq(santri.id, existing.id))
      .returning();

    revalidatePath('/master/santri');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memperbarui data santri' };
  }
}
