export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { aturanSubsidi, subsidiPenerima, tagihan, santri, komplek } from '@ponpes-finance/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { BendaharaSubsidyClient } from '@/components/features/bendahara/BendaharaSubsidyClient';

export default async function BendaharaSubsidiPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { role, complexIds } = session.user;
  if (role !== 'bendahara_komplek' && role !== 'super_admin') {
    redirect('/unauthorized');
  }

  let complexList: any[] = [];
  let rulesList: any[] = [];
  let eventBillsList: any[] = [];
  let pastExecutions: any[] = [];

  try {
    const allComplexes = await db.select().from(komplek).orderBy(komplek.kode);
    if (role === 'bendahara_komplek' && complexIds && !complexIds.includes('all')) {
      complexList = allComplexes.filter((c: any) => complexIds.includes(c.id));
    } else {
      complexList = allComplexes;
    }

    // 1. Fetch Subsidy Rules
    const rawRules = await db
      .select({
        id: aturanSubsidi.id,
        nama: aturanSubsidi.nama,
        nominal: aturanSubsidi.nominal,
        syaratJson: aturanSubsidi.syaratJson,
        isActive: aturanSubsidi.isActive,
        tagihanKegiatanId: aturanSubsidi.tagihanKegiatanId,
        createdAt: aturanSubsidi.createdAt,
      })
      .from(aturanSubsidi)
      .orderBy(desc(aturanSubsidi.createdAt));

    rulesList = rawRules.map((r: any) => ({
      ...r,
      nominal: Number(r.nominal),
    }));

    // 2. Fetch Active Event Bills for Rule Targeting
    const rawBills = await db
      .select({
        id: tagihan.id,
        judul: tagihan.judul,
        tipe: tagihan.tipe,
        nominal: tagihan.nominal,
      })
      .from(tagihan)
      .where(eq(tagihan.tipe, 'kegiatan'))
      .limit(50);

    eventBillsList = rawBills.map((b: any) => ({
      ...b,
      nominal: Number(b.nominal),
    }));

    // 3. Fetch Past Executions History
    const rawExecutions = await db
      .select({
        id: subsidiPenerima.id,
        aturanSubsidiId: subsidiPenerima.aturanSubsidiId,
        aturanNama: aturanSubsidi.nama,
        santriId: subsidiPenerima.santriId,
        santriNis: santri.nis,
        santriNama: santri.nama,
        nominalDiterima: subsidiPenerima.nominalDiterima,
        diterapkanPada: subsidiPenerima.diterapkanPada,
      })
      .from(subsidiPenerima)
      .innerJoin(aturanSubsidi, eq(subsidiPenerima.aturanSubsidiId, aturanSubsidi.id))
      .innerJoin(santri, eq(subsidiPenerima.santriId, santri.id))
      .orderBy(desc(subsidiPenerima.diterapkanPada))
      .limit(100);

    pastExecutions = rawExecutions.map((e: any) => ({
      ...e,
      nominalDiterima: Number(e.nominalDiterima),
    }));
  } catch (err) {
    console.error('Error loading bendahara subsidi page:', err);
  }

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4">
      <BendaharaSubsidyClient
        complexList={complexList}
        initialRules={rulesList}
        eventBillsList={eventBillsList}
        pastExecutions={pastExecutions}
      />
    </div>
  );
}
