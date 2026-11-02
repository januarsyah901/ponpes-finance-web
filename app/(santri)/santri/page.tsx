export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { santri, komplek, kategori, ledgerTabungan, tagihan } from '@ponpes-finance/db/schema';
import { eq, sql, and, ne } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatDateIndo } from '@/lib/formatters';
import { PiggyBank, Receipt, AlertCircle, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SantriDashboardPage() {
  const session = await auth();
  const santriId = session?.user?.santriId;

  if (!santriId) {
    return (
      <div className="p-4 bg-white rounded-xl border border-[#E2E8F0]">
        <p className="text-sm text-[#64748B]">Data santri tidak terhubung dengan akun ini.</p>
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
      <div className="rounded-2xl bg-gradient-to-r from-[#0F5132] to-[#10B981] p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
              Selamat Datang
            </div>
            <h1 className="text-2xl font-bold font-heading mt-1">
              {profile?.nama || session?.user?.nama}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-xs text-emerald-50">
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded">NIS: {profile?.nis}</span>
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
        {/* Tabungan Card */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Saldo Tabungan
            </CardTitle>
            <PiggyBank className="h-5 w-5 text-[#0F5132]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-[#0F172A]">
              <CurrencyDisplay amount={balance} />
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Akumulasi alokasi Rp50.000 / syahriah & saldo awal
            </p>
          </CardContent>
        </Card>

        {/* Tagihan Berjalan Card */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Tagihan Belum Lunas
            </CardTitle>
            <Receipt className="h-5 w-5 text-[#D97706]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-[#D97706]">
              {bills.length} Tagihan
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Jatuh tempo setiap tanggal 10
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bill List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#64748B]">
            Daftar Tagihan Anda
          </h2>
        </div>

        {bills.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E2E8F0]">
            <Receipt className="h-8 w-8 text-[#10B981] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#0F172A]">Alhamdulillah, semua tagihan lunas!</p>
            <p className="text-xs text-[#64748B] mt-1">Tidak ada tunggakan pembayaran yang tercatat.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => (
              <Card key={bill.id} className="border-[#E2E8F0] bg-white">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm text-[#0F172A]">{bill.judul}</div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Jatuh tempo: {formatDateIndo(bill.jatuhTempo)}
                    </div>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={bill.sisa} className="font-bold text-sm text-[#0F172A]" />
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
