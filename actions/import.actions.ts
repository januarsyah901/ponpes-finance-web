'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { komplek, kategori, santri, pengguna, ledgerTabungan } from '@ponpes-finance/db/schema';
import { inArray, eq } from 'drizzle-orm';
import { sanitizeIndonesianPhone } from '@/lib/formatters';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export interface RawExcelRow {
  nis?: string | number;
  nama?: string;
  komplek?: string;
  kategori?: string;
  tanggalMasuk?: string | number;
  status?: string;
  nomorWhatsapp?: string | number;
  namaWali?: string;
  nomorWhatsappWali?: string | number;
  alamat?: string;
  saldoAwal?: string | number;
}

export interface ValidatedImportItem {
  rowIndex: number;
  nis: string;
  nama: string;
  komplekId: string;
  komplekKode: string;
  kategoriId: string;
  kategoriKode: 'pengurus' | 'non_pengurus' | 'mbak_ndalem';
  tanggalMasuk: string;
  status: 'aktif' | 'boyong';
  nomorWhatsapp: string;
  namaWali?: string;
  nomorWhatsappWali?: string;
  alamat?: string;
  saldoAwalTabungan: number;
}

export interface ImportErrorItem {
  rowIndex: number;
  nis?: string;
  field?: string;
  message: string;
}

export interface ValidationSummary {
  isValid: boolean;
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  totalSaldoAwal: number;
  validRows: ValidatedImportItem[];
  errors: ImportErrorItem[];
}

export async function validateExcelRowsAction(rawRows: RawExcelRow[]): Promise<ValidationSummary> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak memiliki akses');
  }

  const currentUser = session.user;
  const errors: ImportErrorItem[] = [];
  const validRows: ValidatedImportItem[] = [];

  if (!rawRows || rawRows.length === 0) {
    return {
      isValid: false,
      totalRows: 0,
      validRowsCount: 0,
      errorRowsCount: 1,
      totalSaldoAwal: 0,
      validRows: [],
      errors: [{ rowIndex: 0, message: 'File Excel kosong atau tidak memiliki baris data' }],
    };
  }

  // 1. Fetch reference lookup data (komplek & kategori)
  const allKompleks = await db.select().from(komplek);
  const allKategoris = await db.select().from(kategori);

  const komplekMap = new Map<string, typeof allKompleks[0]>();
  for (const k of allKompleks) {
    komplekMap.set(k.kode.toUpperCase(), k);
    komplekMap.set(k.nama.toLowerCase(), k);
  }

  const kategoriMap = new Map<string, typeof allKategoris[0]>();
  for (const c of allKategoris) {
    kategoriMap.set(c.kode.toLowerCase(), c);
    kategoriMap.set(c.nama.toLowerCase(), c);
  }

  // 2. Pre-scan all NIS in the file to detect in-file duplicates
  const nisCountMap = new Map<string, number[]>();
  rawRows.forEach((row, idx) => {
    const rawNis = row.nis ? String(row.nis).trim() : '';
    if (rawNis) {
      const existing = nisCountMap.get(rawNis) || [];
      existing.push(idx + 2); // Excel 1-based row index (Row 1 is header)
      nisCountMap.set(rawNis, existing);
    }
  });

  // 3. Pre-fetch existing NIS in database
  const nisList = Array.from(nisCountMap.keys());
  const existingDbSantri = nisList.length > 0
    ? await db.select({ nis: santri.nis }).from(santri).where(inArray(santri.nis, nisList))
    : [];
  const dbNisSet = new Set(existingDbSantri.map((s) => s.nis));

  // 4. Validate each row
  let totalSaldoAwal = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowIndex = i + 2; // Excel row numbering
    let rowHasError = false;

    // Check mandatory NIS
    const nis = row.nis ? String(row.nis).trim() : '';
    if (!nis) {
      errors.push({ rowIndex, field: 'NIS', message: 'NIS wajib diisi' });
      rowHasError = true;
    } else {
      // In-file duplicate check
      const rowsWithNis = nisCountMap.get(nis) || [];
      if (rowsWithNis.length > 1) {
        errors.push({
          rowIndex,
          nis,
          field: 'NIS',
          message: `Duplikat NIS dalam file Excel (muncul di baris ${rowsWithNis.join(', ')})`,
        });
        rowHasError = true;
      }
      // DB duplicate check
      if (dbNisSet.has(nis)) {
        errors.push({
          rowIndex,
          nis,
          field: 'NIS',
          message: `NIS ${nis} sudah terdaftar di database`,
        });
        rowHasError = true;
      }
    }

    // Check mandatory Nama
    const nama = row.nama ? String(row.nama).trim() : '';
    if (!nama) {
      errors.push({ rowIndex, nis, field: 'Nama', message: 'Nama santri wajib diisi' });
      rowHasError = true;
    }

    // Check Komplek
    const rawKomplek = row.komplek ? String(row.komplek).trim() : '';
    let resolvedKomplek = rawKomplek ? (komplekMap.get(rawKomplek.toUpperCase()) || komplekMap.get(rawKomplek.toLowerCase())) : null;
    if (!resolvedKomplek) {
      errors.push({
        rowIndex,
        nis,
        field: 'Komplek',
        message: `Komplek "${rawKomplek}" tidak ditemukan. Pilihan: ${allKompleks.map(k => k.kode).join(', ')}`,
      });
      rowHasError = true;
    } else if (
      currentUser.role === 'bendahara_komplek' &&
      !currentUser.complexIds.includes('all') &&
      !currentUser.complexIds.includes(resolvedKomplek.id)
    ) {
      errors.push({
        rowIndex,
        nis,
        field: 'Komplek',
        message: `Anda tidak berhak mengimpor data ke komplek ${resolvedKomplek.kode}`,
      });
      rowHasError = true;
    }

    // Check Kategori
    const rawKategori = row.kategori ? String(row.kategori).trim().toLowerCase() : '';
    let resolvedKategori = rawKategori ? (kategoriMap.get(rawKategori) || kategoriMap.get(rawKategori.replace(/\s+/g, '_'))) : null;
    if (!resolvedKategori) {
      errors.push({
        rowIndex,
        nis,
        field: 'Kategori',
        message: `Kategori "${row.kategori}" tidak valid. Pilihan: non_pengurus, pengurus, mbak_ndalem`,
      });
      rowHasError = true;
    }

    // Check Tanggal Masuk
    let tanggalMasukStr = '';
    if (row.tanggalMasuk) {
      const rawDate = String(row.tanggalMasuk).trim();
      // Handle YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        tanggalMasukStr = rawDate;
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
        // DD/MM/YYYY
        const [d, m, y] = rawDate.split('/');
        tanggalMasukStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      } else if (!isNaN(Number(rawDate))) {
        // Excel serial date number
        const dateObj = new Date(Math.round((Number(rawDate) - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          tanggalMasukStr = dateObj.toISOString().split('T')[0];
        }
      }
    }
    if (!tanggalMasukStr) {
      tanggalMasukStr = new Date().toISOString().split('T')[0]; // Default to today if omitted
    }

    // Check Status
    const rawStatus = row.status ? String(row.status).trim().toLowerCase() : 'aktif';
    const status: 'aktif' | 'boyong' = rawStatus === 'boyong' ? 'boyong' : 'aktif';

    // Check & Sanitize Phone Number
    let nomorWhatsapp = '';
    const rawPhone = row.nomorWhatsapp ? String(row.nomorWhatsapp).trim() : '';
    if (!rawPhone) {
      errors.push({ rowIndex, nis, field: 'No WhatsApp', message: 'Nomor WhatsApp wajib diisi' });
      rowHasError = true;
    } else {
      try {
        nomorWhatsapp = sanitizeIndonesianPhone(rawPhone);
      } catch (err: any) {
        errors.push({ rowIndex, nis, field: 'No WhatsApp', message: err.message || 'Nomor WhatsApp tidak valid' });
        rowHasError = true;
      }
    }

    // Check Saldo Awal
    let saldoAwalTabungan = 0;
    if (row.saldoAwal !== undefined && row.saldoAwal !== null && row.saldoAwal !== '') {
      const num = Number(String(row.saldoAwal).replace(/[^\d]/g, ''));
      if (isNaN(num) || num < 0) {
        errors.push({ rowIndex, nis, field: 'Saldo Awal', message: 'Saldo awal harus berupa angka non-negatif' });
        rowHasError = true;
      } else {
        saldoAwalTabungan = Math.floor(num);
      }
    }

    if (!rowHasError && resolvedKomplek && resolvedKategori) {
      totalSaldoAwal += saldoAwalTabungan;
      validRows.push({
        rowIndex,
        nis,
        nama,
        komplekId: resolvedKomplek.id,
        komplekKode: resolvedKomplek.kode,
        kategoriId: resolvedKategori.id,
        kategoriKode: resolvedKategori.kode as any,
        tanggalMasuk: tanggalMasukStr,
        status,
        nomorWhatsapp,
        namaWali: row.namaWali ? String(row.namaWali).trim() : undefined,
        nomorWhatsappWali: row.nomorWhatsappWali ? String(row.nomorWhatsappWali).trim() : undefined,
        alamat: row.alamat ? String(row.alamat).trim() : undefined,
        saldoAwalTabungan,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    totalRows: rawRows.length,
    validRowsCount: validRows.length,
    errorRowsCount: errors.length,
    totalSaldoAwal,
    validRows,
    errors,
  };
}

export async function commitBatchSantriImportAction(validRows: ValidatedImportItem[]): Promise<{
  success: boolean;
  insertedCount: number;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak memiliki akses');
  }

  if (!validRows || validRows.length === 0) {
    return { success: false, insertedCount: 0, error: 'Tidak ada baris valid untuk diimpor' };
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash('password123', salt);

    let insertedCount = 0;

    for (const item of validRows) {
      // 1. Insert Santri
      const [newSantri] = await db.insert(santri).values({
        nis: item.nis,
        nama: item.nama,
        komplekId: item.komplekId,
        kategoriId: item.kategoriId,
        tanggalMasuk: item.tanggalMasuk,
        status: item.status,
        nomorWhatsapp: item.nomorWhatsapp,
        namaWali: item.namaWali || null,
        nomorWhatsappWali: item.nomorWhatsappWali || null,
        alamat: item.alamat || null,
      }).returning();

      // 2. Insert Pengguna
      await db.insert(pengguna).values({
        username: newSantri.nis,
        passwordHash: defaultPasswordHash,
        nama: newSantri.nama,
        role: 'santri',
        isFirstLogin: true,
        isActive: true,
        santriId: newSantri.id,
      });

      // 3. Insert Opening Savings Balance if > 0
      if (item.saldoAwalTabungan > 0) {
        await db.insert(ledgerTabungan).values({
          santriId: newSantri.id,
          jenisMutasi: 'saldo_awal',
          nominal: item.saldoAwalTabungan,
          referensiTipe: 'impor_excel',
          keterangan: 'Saldo tabungan awal hasil impor Excel',
          dibuatOlehId: session.user.id,
        });
      }

      insertedCount++;
    }

    revalidatePath('/master/santri');
    revalidatePath('/bendahara');
    return { success: true, insertedCount };
  } catch (err: any) {
    return { success: false, insertedCount: 0, error: err.message || 'Gagal menyimpan data impor' };
  }
}
