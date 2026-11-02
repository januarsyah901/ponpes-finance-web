export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { santri, komplek, kategori, tagihan, ledgerTabungan, tarifSyahriah } from '@ponpes-finance/db/schema';
import { eq, inArray, and, sql, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { CashDeskClient } from '@/components/features/bendahara/CashDeskClient';

export default async function BendaharaKasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { role, complexIds } = session.user;
  if (role !== 'bendahara_komplek' && role !== 'super_admin') {
    redirect('/unauthorized');
  }

  let santriList: any[] = [];
  let allUnpaidBills: any[] = [];
  let defaultRate = 350000;

  try {
    const whereConditions = [eq(santri.status, 'aktif')];
    if (role === 'bendahara_komplek' && complexIds && !complexIds.includes('all')) {
      whereConditions.push(inArray(santri.komplekId, complexIds));
    }

    // 1. Fetch active santri with complex, category, and derived savings balance
    const santriRows = await db
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
      .where(and(...whereConditions))
      .orderBy(santri.nama);

    // Fetch savings balances
    const santriIds = santriRows.map((s) => s.id);
    let savingsMap = new Map<string, number>();

    if (santriIds.length > 0) {
      const savingsRows = await db
        .select({
          santriId: ledgerTabungan.santriId,
          total: sql<number>`COALESCE(SUM(${ledgerTabungan.nominal}), 0)::int`,
        })
        .from(ledgerTabungan)
        .where(inArray(ledgerTabungan.santriId, santriIds))
        .groupBy(ledgerTabungan.santriId);

      for (const row of savingsRows) {
        savingsMap.set(row.santriId, row.total);
      }
    }

    santriList = santriRows.map((s) => ({
      ...s,
      saldoTabungan: savingsMap.get(s.id) || 0,
    }));

    // 2. Fetch all unpaid bills for these santri
    if (santriIds.length > 0) {
      allUnpaidBills = await db
        .select({
          id: tagihan.id,
          santriId: tagihan.santriId,
          tipe: tagihan.tipe,
          judul: tagihan.judul,
          bulan: tagihan.bulan,
          tahun: tagihan.tahun,
          jatuhTempo: tagihan.jatuhTempo,
          nominal: tagihan.nominal,
          terbayar: tagihan.terbayar,
          sisa: tagihan.sisa,
          status: tagihan.status,
        })
        .from(tagihan)
        .where(
          and(
            inArray(tagihan.santriId, santriIds),
            sql`${tagihan.status} IN ('belum_bayar', 'sebagian')`
          )
        )
        .orderBy(tagihan.jatuhTempo);
    }

    // 3. Fetch a sample active rate
    const [rateRow] = await db
      .select({ nominal: tarifSyahriah.nominal })
      .from(tarifSyahriah)
      .where(eq(tarifSyahriah.isActive, true))
      .limit(1);

    if (rateRow) {
      defaultRate = Number(rateRow.nominal);
    }
  } catch {
    // Database fallback during static build phases
  }

  return (
    <CashDeskClient
      santriList={santriList}
      allUnpaidBills={allUnpaidBills}
      defaultTarifNominal={defaultRate}
    />
  );
}
