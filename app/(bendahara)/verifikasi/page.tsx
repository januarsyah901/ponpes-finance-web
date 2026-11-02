export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { pembayaran, santri, komplek, kategori } from '@ponpes-finance/db/schema';
import { eq, inArray, and, desc, sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { VerificationQueueClient } from '@/components/features/bendahara/VerificationQueueClient';

export default async function BendaharaVerifikasiPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { role, complexIds } = session.user;
  if (role !== 'bendahara_komplek' && role !== 'super_admin') {
    redirect('/unauthorized');
  }

  let complexList: any[] = [];
  let pendingPayments: any[] = [];
  let pendingMetrics: any = null;
  let todayVerified: any = null;

  try {
    // 1. Complexes Query
    const allComplexes = await db.select().from(komplek).orderBy(komplek.kode);
    if (role === 'bendahara_komplek' && complexIds && !complexIds.includes('all')) {
      complexList = allComplexes.filter((c) => complexIds.includes(c.id));
    } else {
      complexList = allComplexes;
    }

    const whereConditions = [];
    if (role === 'bendahara_komplek' && complexIds && !complexIds.includes('all')) {
      whereConditions.push(inArray(pembayaran.komplekId, complexIds));
    }

    // 2. Pending Verification Payments Query
    pendingPayments = await db
      .select({
        id: pembayaran.id,
        santriId: pembayaran.santriId,
        santriNis: santri.nis,
        santriNama: santri.nama,
        komplekId: pembayaran.komplekId,
        komplekKode: komplek.kode,
        komplekNama: komplek.nama,
        kategoriNama: kategori.nama,
        metode: pembayaran.metode,
        nominal: pembayaran.nominal,
        nominalDiverifikasi: pembayaran.nominalDiverifikasi,
        tanggalBayar: pembayaran.tanggalBayar,
        buktiUrl: pembayaran.buktiUrl,
        catatanSantri: pembayaran.catatanSantri,
        status: pembayaran.status,
        alasanPenolakan: pembayaran.alasanPenolakan,
        createdAt: pembayaran.createdAt,
      })
      .from(pembayaran)
      .innerJoin(santri, eq(pembayaran.santriId, santri.id))
      .innerJoin(komplek, eq(pembayaran.komplekId, komplek.id))
      .innerJoin(kategori, eq(santri.kategoriId, kategori.id))
      .where(
        whereConditions.length > 0
          ? and(eq(pembayaran.status, 'menunggu_verifikasi'), ...whereConditions)
          : eq(pembayaran.status, 'menunggu_verifikasi')
      )
      .orderBy(desc(pembayaran.createdAt));

    // 3. Queue KPI Metrics
    const [pm] = await db
      .select({
        count: sql<number>`count(*)::int`,
        totalNominal: sql<number>`COALESCE(sum(${pembayaran.nominal}), 0)::int`,
      })
      .from(pembayaran)
      .where(
        whereConditions.length > 0
          ? and(eq(pembayaran.status, 'menunggu_verifikasi'), ...whereConditions)
          : eq(pembayaran.status, 'menunggu_verifikasi')
      );
    pendingMetrics = pm;

    const todayStr = new Date().toISOString().split('T')[0];
    const [tv] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(pembayaran)
      .where(
        whereConditions.length > 0
          ? and(
              eq(pembayaran.status, 'terverifikasi'),
              sql`DATE(${pembayaran.diverifikasiPada}) = ${todayStr}::date`,
              ...whereConditions
            )
          : and(
              eq(pembayaran.status, 'terverifikasi'),
              sql`DATE(${pembayaran.diverifikasiPada}) = ${todayStr}::date`
            )
      );
    todayVerified = tv;
  } catch {
    // Database fallback during static build phases
  }

  return (
    <div className="space-y-6">
      <VerificationQueueClient
        initialQueue={pendingPayments}
        complexList={complexList}
        metrics={{
          pendingCount: pendingMetrics?.count || 0,
          pendingTotal: pendingMetrics?.totalNominal || 0,
          todayVerifiedCount: todayVerified?.count || 0,
        }}
      />
    </div>
  );
}
