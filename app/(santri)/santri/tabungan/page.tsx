export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { santri, komplek, kategori, ledgerTabungan } from '@ponpes-finance/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { SantriSavingsViewClient } from '@/components/features/santri/SantriSavingsViewClient';

export default async function SantriTabunganPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const santriId = session.user.santriId;
  if (!santriId) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center">
        <p className="text-sm text-slate-500">Akun ini tidak terhubung dengan data profil santri aktif.</p>
      </div>
    );
  }

  let profile: any = null;
  let totalBalance = 0;
  const breakdown = {
    setoranSyahriah: 0,
    saldoAwal: 0,
    pemakaianKegiatan: 0,
    penarikanMendesak: 0,
    penarikanBoyong: 0,
    koreksi: 0,
  };
  let mutationsList: any[] = [];

  try {
    // 1. Fetch Santri Profile
    const [p] = await db
      .select({
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        status: santri.status,
        komplekNama: komplek.nama,
        kategoriNama: kategori.nama,
        nomorWhatsapp: santri.nomorWhatsapp,
        nomorWhatsappWali: santri.nomorWhatsappWali,
      })
      .from(santri)
      .innerJoin(komplek, eq(santri.komplekId, komplek.id))
      .innerJoin(kategori, eq(santri.kategoriId, kategori.id))
      .where(eq(santri.id, santriId))
      .limit(1);
    profile = p;

    // 2. Derive Current Balance: SUM(nominal)
    const [balanceResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${ledgerTabungan.nominal}), 0)::int`,
      })
      .from(ledgerTabungan)
      .where(eq(ledgerTabungan.santriId, santriId));
    totalBalance = balanceResult?.total || 0;

    // 3. Breakdown by Mutation Type
    const breakdownRows = await db
      .select({
        jenisMutasi: ledgerTabungan.jenisMutasi,
        total: sql<number>`COALESCE(SUM(${ledgerTabungan.nominal}), 0)::int`,
      })
      .from(ledgerTabungan)
      .where(eq(ledgerTabungan.santriId, santriId))
      .groupBy(ledgerTabungan.jenisMutasi);

    for (const row of breakdownRows) {
      if (row.jenisMutasi === 'setoran_syahriah') breakdown.setoranSyahriah = Number(row.total);
      else if (row.jenisMutasi === 'saldo_awal') breakdown.saldoAwal = Number(row.total);
      else if (row.jenisMutasi === 'pemakaian_kegiatan') breakdown.pemakaianKegiatan = Number(row.total);
      else if (row.jenisMutasi === 'penarikan_mendesak') breakdown.penarikanMendesak = Number(row.total);
      else if (row.jenisMutasi === 'penarikan_boyong') breakdown.penarikanBoyong = Number(row.total);
      else if (row.jenisMutasi === 'koreksi') breakdown.koreksi = Number(row.total);
    }

    // 4. Chronological Ledger Mutation History
    const rows = await db
      .select({
        id: ledgerTabungan.id,
        jenisMutasi: ledgerTabungan.jenisMutasi,
        nominal: ledgerTabungan.nominal,
        referensiTipe: ledgerTabungan.referensiTipe,
        referensiId: ledgerTabungan.referensiId,
        keterangan: ledgerTabungan.keterangan,
        createdAt: ledgerTabungan.createdAt,
      })
      .from(ledgerTabungan)
      .where(eq(ledgerTabungan.santriId, santriId))
      .orderBy(desc(ledgerTabungan.createdAt))
      .limit(100);

    mutationsList = rows.map((r: any) => ({
      ...r,
      nominal: Number(r.nominal),
    }));
  } catch (err) {
    console.error('Error loading santri tabungan page:', err);
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-4">
      <SantriSavingsViewClient
        profile={profile}
        balance={totalBalance}
        breakdown={breakdown}
        initialMutations={mutationsList}
      />
    </div>
  );
}
