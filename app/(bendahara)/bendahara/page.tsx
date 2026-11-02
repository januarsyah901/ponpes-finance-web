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
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
          Dashboard Manajemen Keuangan
        </h1>
        <p className="text-sm text-[#64748B]">
          Selamat datang di portal administrasi pondok pesantren. Kelola master data, tagihan, dan tabungan santri.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Santri Aktif
            </CardTitle>
            <Users className="h-4 w-4 text-[#0F5132]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A] font-heading">
              {santriAktifCount?.value || 0}
            </div>
            <p className="text-xs text-[#64748B] mt-1">Terdaftar di database</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Komplek Asrama
            </CardTitle>
            <Building2 className="h-4 w-4 text-[#0F5132]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A] font-heading">
              {komplekCount?.value || 0}
            </div>
            <p className="text-xs text-[#64748B] mt-1">Komplek putra & putri</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Kategori Santri
            </CardTitle>
            <Tags className="h-4 w-4 text-[#0F5132]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A] font-heading">
              {kategoriCount?.value || 0}
            </div>
            <p className="text-xs text-[#64748B] mt-1">Reguler, Pengurus, Ndalem</p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Jadwal Tarif Aktif
            </CardTitle>
            <Grid3X3 className="h-4 w-4 text-[#0F5132]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0F172A] font-heading">
              {tarifCount?.value || 0}
            </div>
            <p className="text-xs text-[#64748B] mt-1">Kombinasi komplek × kategori</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#E2E8F0] hover:border-[#0F5132] transition-colors">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-[#EBF5F0] text-[#0F5132] flex items-center justify-center mb-2">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">Direktori Santri</CardTitle>
            <p className="text-xs text-[#64748B]">
              Lihat dan kelola profil santri, status aktif/boyong, serta riwayat pendaftaran.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/master/santri">
              <Button variant="outline" className="w-full justify-between">
                <span>Buka Direktori</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] hover:border-[#0F5132] transition-colors">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-[#EBF5F0] text-[#0F5132] flex items-center justify-center mb-2">
              <Grid3X3 className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">Matriks Tarif Syahriah</CardTitle>
            <p className="text-xs text-[#64748B]">
              Kelola nominal syahriah per komplek dan kategori santri dengan alokasi tabungan tetap Rp50.000.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/master/tarif">
              <Button variant="outline" className="w-full justify-between">
                <span>Atur Matriks Tarif</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] hover:border-[#0F5132] transition-colors">
          <CardHeader>
            <div className="h-10 w-10 rounded-xl bg-[#EBF5F0] text-[#0F5132] flex items-center justify-center mb-2">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <CardTitle className="text-base font-semibold">Impor Data Excel</CardTitle>
            <p className="text-xs text-[#64748B]">
              Unggah file spreadsheet `.xlsx` santri dengan validasi otomatis dan pratinjau interaktif.
            </p>
          </CardHeader>
          <CardContent>
            <Link href="/master/santri/impor">
              <Button variant="outline" className="w-full justify-between">
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
