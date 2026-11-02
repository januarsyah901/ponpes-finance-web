export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { tagihan, santri, komplek } from '@ponpes-finance/db/schema';
import { eq, inArray, desc, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { BillingPageClient } from '@/components/features/bendahara/BillingPageClient';

export default async function BendaharaTagihanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { role, complexIds } = session.user;
  if (role !== 'bendahara_komplek' && role !== 'super_admin') {
    redirect('/unauthorized');
  }

  let complexList: any[] = [];
  let billsList: any[] = [];
  const now = new Date();
  const currentBulan = now.getMonth() + 1;
  const currentTahun = now.getFullYear();

  try {
    const allComplexes = await db.select().from(komplek).orderBy(komplek.kode);
    if (role === 'bendahara_komplek' && complexIds && !complexIds.includes('all')) {
      complexList = allComplexes.filter((c) => complexIds.includes(c.id));
    } else {
      complexList = allComplexes;
    }

    const whereConditions = [];
    if (role === 'bendahara_komplek' && complexIds && !complexIds.includes('all')) {
      whereConditions.push(inArray(tagihan.komplekId, complexIds));
    }

    billsList = await db
      .select({
        id: tagihan.id,
        santriId: tagihan.santriId,
        santriNis: santri.nis,
        santriNama: santri.nama,
        komplekId: tagihan.komplekId,
        komplekKode: komplek.kode,
        komplekNama: komplek.nama,
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
      .innerJoin(santri, eq(tagihan.santriId, santri.id))
      .innerJoin(komplek, eq(tagihan.komplekId, komplek.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(tagihan.createdAt))
      .limit(100);
  } catch {
    // Database fallback during static build phases
  }

  return (
    <BillingPageClient
      initialBills={billsList}
      complexList={complexList}
      currentBulan={currentBulan}
      currentTahun={currentTahun}
    />
  );
}
