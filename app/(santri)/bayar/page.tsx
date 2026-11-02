export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { santri, komplek, kategori, tagihan, pembayaran } from '@ponpes-finance/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { PaymentFormClient } from '@/components/features/santri/PaymentFormClient';

export default async function SantriBayarPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'santri' && session.user.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const santriId = session.user.santriId;
  if (!santriId) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-[#E2E8F0] text-center">
        <p className="text-sm text-[#64748B]">Akun ini tidak terhubung dengan profil santri.</p>
      </div>
    );
  }

  let profile: any = null;
  let unpaidBills: any[] = [];
  let lastRejected: any = null;

  try {
    // 1. Fetch Santri Profile
    const [p] = await db
      .select({
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        komplekId: santri.komplekId,
        komplekNama: komplek.nama,
        kategoriNama: kategori.nama,
      })
      .from(santri)
      .innerJoin(komplek, eq(santri.komplekId, komplek.id))
      .innerJoin(kategori, eq(santri.kategoriId, kategori.id))
      .where(eq(santri.id, santriId))
      .limit(1);
    profile = p;

    // 2. Fetch Unpaid Bills (Syahriah & Kegiatan)
    unpaidBills = await db
      .select({
        id: tagihan.id,
        judul: tagihan.judul,
        tipe: tagihan.tipe,
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
          eq(tagihan.santriId, santriId),
          ne(tagihan.status, 'lunas'),
          ne(tagihan.status, 'dibatalkan')
        )
      )
      .orderBy(tagihan.jatuhTempo);

    // 3. Fetch Latest Rejected Payment (if any) to alert santri
    const [rej] = await db
      .select({
        id: pembayaran.id,
        nominal: pembayaran.nominal,
        tanggalBayar: pembayaran.tanggalBayar,
        alasanPenolakan: pembayaran.alasanPenolakan,
        updatedAt: pembayaran.updatedAt,
      })
      .from(pembayaran)
      .where(
        and(
          eq(pembayaran.santriId, santriId),
          eq(pembayaran.status, 'ditolak')
        )
      )
      .orderBy(desc(pembayaran.updatedAt))
      .limit(1);
    lastRejected = rej || null;
  } catch {
    // DB fallback during static build phases
  }

  if (!profile) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-[#E2E8F0] text-center">
        <p className="text-sm text-[#64748B]">Data profil santri tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <PaymentFormClient
        santriId={santriId}
        profile={profile}
        unpaidBills={unpaidBills}
        lastRejected={lastRejected}
      />
    </div>
  );
}
