export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { santri, komplek, kategori, ledgerTabungan } from '@ponpes-finance/db/schema';
import { eq, inArray, sql, desc, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { BendaharaSavingsClient } from '@/components/features/bendahara/BendaharaSavingsClient';

export default async function BendaharaTabunganPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { role, complexIds } = session.user;
  if (role !== 'bendahara_komplek' && role !== 'super_admin') {
    redirect('/unauthorized');
  }

  let complexList: any[] = [];
  let santriSavingsList: any[] = [];
  let totalComplexSavings = 0;
  let activeSantriCount = 0;
  let monthlyCreditTotal = 0;
  let monthlyDebitTotal = 0;

  try {
    // 1. Fetch authorized complexes
    const allComplexes = await db.select().from(komplek).orderBy(komplek.kode);
    if (role === 'bendahara_komplek' && complexIds && !complexIds.includes('all')) {
      complexList = allComplexes.filter((c: any) => complexIds.includes(c.id));
    } else {
      complexList = allComplexes;
    }

    const authorizedComplexIds = complexList.map((c: any) => c.id);

    if (authorizedComplexIds.length > 0) {
      // 2. Aggregate Santri Savings Balances in Complex Scope
      const rawList = await db
        .select({
          id: santri.id,
          nis: santri.nis,
          nama: santri.nama,
          status: santri.status,
          komplekId: santri.komplekId,
          komplekKode: komplek.kode,
          komplekNama: komplek.nama,
          kategoriKode: kategori.kode,
          kategoriNama: kategori.nama,
          saldoTabungan: sql<number>`COALESCE(SUM(${ledgerTabungan.nominal}), 0)::int`,
          totalCredit: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerTabungan.nominal} > 0 THEN ${ledgerTabungan.nominal} ELSE 0 END), 0)::int`,
          totalDebit: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerTabungan.nominal} < 0 THEN ABS(${ledgerTabungan.nominal}) ELSE 0 END), 0)::int`,
          terakhirMutasi: sql<string>`MAX(${ledgerTabungan.createdAt})::text`,
        })
        .from(santri)
        .innerJoin(komplek, eq(santri.komplekId, komplek.id))
        .innerJoin(kategori, eq(santri.kategoriId, kategori.id))
        .leftJoin(ledgerTabungan, eq(santri.id, ledgerTabungan.santriId))
        .where(inArray(santri.komplekId, authorizedComplexIds))
        .groupBy(
          santri.id,
          santri.nis,
          santri.nama,
          santri.status,
          santri.komplekId,
          komplek.kode,
          komplek.nama,
          kategori.kode,
          kategori.nama
        )
        .orderBy(desc(sql`COALESCE(SUM(${ledgerTabungan.nominal}), 0)`));

      santriSavingsList = rawList.map((r: any) => ({
        ...r,
        saldoTabungan: Number(r.saldoTabungan || 0),
        totalCredit: Number(r.totalCredit || 0),
        totalDebit: Number(r.totalDebit || 0),
      }));

      // 3. Compute KPI Overview
      totalComplexSavings = santriSavingsList.reduce((acc, curr) => acc + (curr.saldoTabungan || 0), 0);
      activeSantriCount = santriSavingsList.filter((s) => s.status === 'aktif' && s.saldoTabungan > 0).length;

      // Current month credits & debits
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [monthlyStats] = await db
        .select({
          credits: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerTabungan.nominal} > 0 THEN ${ledgerTabungan.nominal} ELSE 0 END), 0)::int`,
          debits: sql<number>`COALESCE(SUM(CASE WHEN ${ledgerTabungan.nominal} < 0 THEN ABS(${ledgerTabungan.nominal}) ELSE 0 END), 0)::int`,
        })
        .from(ledgerTabungan)
        .innerJoin(santri, eq(ledgerTabungan.santriId, santri.id))
        .where(
          and(
            inArray(santri.komplekId, authorizedComplexIds),
            sql`${ledgerTabungan.createdAt} >= ${startOfMonth}`
          )
        );

      monthlyCreditTotal = Number(monthlyStats?.credits || 0);
      monthlyDebitTotal = Number(monthlyStats?.debits || 0);
    }
  } catch (err) {
    console.error('Error loading bendahara tabungan page:', err);
  }

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4">
      <BendaharaSavingsClient
        complexList={complexList}
        initialSantriList={santriSavingsList}
        kpiData={{
          totalSavings: totalComplexSavings,
          activeSantriWithBalance: activeSantriCount,
          monthlyCredit: monthlyCreditTotal,
          monthlyDebit: monthlyDebitTotal,
        }}
      />
    </div>
  );
}
