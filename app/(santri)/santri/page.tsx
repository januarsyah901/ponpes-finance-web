export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { santri, komplek, kategori, ledgerTabungan, tagihan } from '@ponpes-finance/db/schema';
import { eq, sql, and, ne } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatDateIndo } from '@/lib/formatters';
import { PiggyBank, Receipt, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SantriDashboardPage() {
  const session = await auth();
  const santriId = session?.user?.santriId;

  if (!santriId) {
    return (
      <div className="p-4 bg-white rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <p className="text-sm text-[#626262]">Data santri tidak terhubung dengan akun ini.</p>
      </div>
    );
  }

  let profile: any = null;
  let balance = 0;
  let bills: any[] = [];

  try {
    // Fetch santri profile
    const [p] = await db
      .select({
        id: santri.id,
        nis: santri.nis,
        nama: santri.nama,
        status: santri.status,
        komplekNama: komplek.nama,
        kategoriNama: kategori.nama,
        tanggalMasuk: santri.tanggalMasuk,
      })
      .from(santri)
      .innerJoin(komplek, eq(santri.komplekId, komplek.id))
      .innerJoin(kategori, eq(santri.kategoriId, kategori.id))
      .where(eq(santri.id, santriId))
      .limit(1);
    profile = p;

    // Fetch savings balance: SUM(nominal)
    const [savings] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${ledgerTabungan.nominal}), 0)::int`,
      })
      .from(ledgerTabungan)
      .where(eq(ledgerTabungan.santriId, santriId));
    balance = savings?.total || 0;

    // Fetch active bills
    bills = await db
      .select()
      .from(tagihan)
      .where(and(eq(tagihan.santriId, santriId), ne(tagihan.status, 'lunas'), ne(tagihan.status, 'dibatalkan')))
      .limit(5);
  } catch {
    // Fallback when DB is unreachable during build
  }

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-[18px] bg-white border border-[#E8E8E8] p-6 text-[#202119] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5F5F5] text-[#202119] border border-[#E8E8E8] mb-2">
              Portal Santri
            </div>
            <h1 className="text-2xl font-bold font-heading text-[#202119]">
              {profile?.nama || session?.user?.nama}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#747474]">
              <span className="font-sans tabular-nums lining-nums bg-[#F5F5F5] text-[#202119] px-2 py-0.5 rounded-[6px] border border-[#E8E8E8]">
                NIS: {profile?.nis}
              </span>
              <span>•</span>
              <span>{profile?.komplekNama}</span>
              <span>•</span>
              <span>{profile?.kategoriNama}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings & Bills Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tabungan Card - Earnings Gradient Card */}
        <Card className="rounded-[18px] border-none text-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden" style={{ background: 'linear-gradient(155deg, #FF9365, #F04B25)' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-white/90 uppercase tracking-wider">
              Saldo Tabungan
            </CardTitle>
            <div className="p-2 rounded-full bg-white/20">
              <PiggyBank className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-white">
              <CurrencyDisplay amount={balance} className="text-white" />
            </div>
            <p className="text-xs text-white/80 mt-1">
              Akumulasi alokasi Rp50.000 / syahriah & saldo awal
            </p>
          </CardContent>
        </Card>

        {/* Tagihan Berjalan Card */}
        <Card className="rounded-[18px] border border-[#E8E8E8] bg-white text-[#202119] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#626262] uppercase tracking-wider">
              Tagihan Belum Lunas
            </CardTitle>
            <div className="p-2 rounded-full bg-[#FFF7ED]">
              <Receipt className="h-5 w-5 text-[#C2410C]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-[#202119] tabular-nums lining-nums">
              {bills.length} Tagihan
            </div>
            <p className="text-xs text-[#747474] mt-1">
              Jatuh tempo setiap tanggal 10
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bill List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#626262]">
            Daftar Tagihan Anda
          </h2>
          <Link href="/santri/bayar">
            <Button size="sm" className="bg-[#202119] hover:bg-[#2e2f26] text-white text-xs font-medium rounded-[8px] shadow-none">
              Bayar Tagihan
            </Button>
          </Link>
        </div>

        {bills.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <CheckCircle2 className="h-8 w-8 text-[#2B8A60] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#202119]">Alhamdulillah, semua tagihan lunas!</p>
            <p className="text-xs text-[#747474] mt-1">Tidak ada tunggakan pembayaran yang tercatat.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => (
              <Card key={bill.id} className="rounded-[18px] border border-[#E8E8E8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#626262] transition">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm text-[#202119]">{bill.judul}</div>
                    <div className="text-xs text-[#747474] mt-0.5">
                      Jatuh tempo: {formatDateIndo(bill.jatuhTempo)}
                    </div>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={bill.sisa} className="font-bold text-sm text-[#202119]" />
                    <div className="mt-1">
                      <StatusBadge status={bill.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
