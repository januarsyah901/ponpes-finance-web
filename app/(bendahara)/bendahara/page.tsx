export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from '@/lib/db';
import { komplek, kategori, santri, tarifSyahriah } from '@ponpes-finance/db/schema';
import { count, eq } from 'drizzle-orm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Tags, Users, Grid3X3, FileSpreadsheet, ArrowRight } from 'lucide-react';

export default async function BendaharaDashboardPage() {
  let komplekCount = { value: 0 };
  let kategoriCount = { value: 0 };
  let santriAktifCount = { value: 0 };
  let tarifCount = { value: 0 };

  try {
    const [kc] = await db.select({ value: count() }).from(komplek);
    const [katc] = await db.select({ value: count() }).from(kategori);
    const [sac] = await db.select({ value: count() }).from(santri).where(eq(santri.status, 'aktif'));
    const [tc] = await db.select({ value: count() }).from(tarifSyahriah).where(eq(tarifSyahriah.isActive, true));

    if (kc) komplekCount = kc;
    if (katc) kategoriCount = katc;
    if (sac) santriAktifCount = sac;
    if (tc) tarifCount = tc;
  } catch {
    // Database connection may not be present during build-time static generation
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-heading">
          Dashboard Manajemen Keuangan
        </h1>
        <p className="text-sm text-[#757575]">
          Selamat datang di portal administrasi pondok pesantren. Kelola master data, tagihan, dan tabungan santri.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[rgba(0,0,0,0.6)] uppercase tracking-wider">
              Santri Aktif
            </CardTitle>
            <Users className="h-4 w-4 text-[#0075de]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111111] font-heading">
              {santriAktifCount?.value || 0}
            </div>
            <p className="text-xs text-[#757575] mt-1">Terdaftar di database</p>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[rgba(0,0,0,0.6)] uppercase tracking-wider">
              Komplek Asrama
            </CardTitle>
            <Building2 className="h-4 w-4 text-[#ffb110]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111111] font-heading">
              {komplekCount?.value || 0}
            </div>
            <p className="text-xs text-[#757575] mt-1">Komplek putra &amp; putri</p>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[rgba(0,0,0,0.6)] uppercase tracking-wider">
              Kategori Santri
            </CardTitle>
            <Tags className="h-4 w-4 text-[#f64932]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111111] font-heading">
              {kategoriCount?.value || 0}
            </div>
            <p className="text-xs text-[#757575] mt-1">Reguler, Pengurus, Ndalem</p>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-[rgba(0,0,0,0.6)] uppercase tracking-wider">
              Jadwal Tarif Aktif
            </CardTitle>
            <Grid3X3 className="h-4 w-4 text-[#62aef0]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#111111] font-heading">
              {tarifCount?.value || 0}
            </div>
            <p className="text-xs text-[#757575] mt-1">Kombinasi komplek × kategori</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none bg-white hover:border-[rgba(0,0,0,0.18)] transition-colors">
          <CardHeader>
            <div className="h-10 w-10 rounded-[10px] bg-[#e6f3fe] text-[#0075de] flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold text-[#111111]">Direktori Santri</CardTitle>
            <p className="text-xs text-[#757575]">
              Lihat dan kelola profil santri, status aktif/boyong, serta riwayat pendaftaran.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/master/santri">
              <Button
                variant="outline"
                className="w-full justify-between border border-[rgba(0,0,0,0.12)] bg-white text-[#111111] rounded-[8px] shadow-none hover:bg-[#f6f5f4]"
              >
                <span>Buka Direktori</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none bg-white hover:border-[rgba(0,0,0,0.18)] transition-colors">
          <CardHeader>
            <div className="h-10 w-10 rounded-[10px] bg-[#e6f3fe] text-[#0075de] flex items-center justify-center mb-2">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold text-[#111111]">Matriks Tarif Syahriah</CardTitle>
            <p className="text-xs text-[#757575]">
              Kelola nominal syahriah per komplek dan kategori santri dengan alokasi tabungan tetap Rp50.000.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/master/tarif">
              <Button
                variant="outline"
                className="w-full justify-between border border-[rgba(0,0,0,0.12)] bg-white text-[#111111] rounded-[8px] shadow-none hover:bg-[#f6f5f4]"
              >
                <span>Atur Matriks Tarif</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] shadow-none bg-white hover:border-[rgba(0,0,0,0.18)] transition-colors">
          <CardHeader>
            <div className="h-10 w-10 rounded-[10px] bg-[#e6f3fe] text-[#0075de] flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold text-[#111111]">Impor Data Excel</CardTitle>
            <p className="text-xs text-[#757575]">
              Unggah file spreadsheet `.xlsx` santri dengan validasi otomatis dan pratinjau interaktif.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/master/santri/impor">
              <Button
                variant="outline"
                className="w-full justify-between border border-[rgba(0,0,0,0.12)] bg-white text-[#111111] rounded-[8px] shadow-none hover:bg-[#f6f5f4]"
              >
                <span>Buka Wizard Impor</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
