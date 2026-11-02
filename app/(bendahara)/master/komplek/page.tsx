export const dynamic = 'force-dynamic';

import { getKomplekList } from '@/actions/master.actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Building2, Users } from 'lucide-react';

export default async function KomplekMasterPage() {
  const complexes = await getKomplekList();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
            Data Komplek Asrama
          </h1>
          <p className="text-sm text-[#64748B]">
            Daftar komplek pemukiman santri putra dan putri pondok pesantren.
          </p>
        </div>
      </div>

      {/* Grid of complexes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {complexes.map((k) => (
          <Card key={k.id} className="border-[#E2E8F0] bg-white hover:border-[#0F5132] transition-colors">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <Badge variant={k.jenis === 'putra' ? 'default' : 'secondary'} className="mb-2 uppercase text-[10px]">
                  {k.jenis}
                </Badge>
                <CardTitle className="text-base font-semibold text-[#0F172A]">
                  {k.nama}
                </CardTitle>
                <div className="text-xs font-mono font-bold text-[#0F5132] mt-0.5">
                  Kode: {k.kode}
                </div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-[#EBF5F0] text-[#0F5132] flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#64748B] mb-4 min-h-[32px]">
                {k.deskripsi || 'Tidak ada deskripsi komplek.'}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-xs">
                <span className="text-[#64748B]">Jumlah Santri</span>
                <span className="font-semibold text-[#0F172A] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#0F5132]" />
                  {k.santriCount} santri
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tabel Rincian Komplek</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Komplek</TableHead>
                <TableHead>Jenis Asrama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Total Santri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complexes.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-mono font-bold text-[#0F5132]">{k.kode}</TableCell>
                  <TableCell className="font-semibold">{k.nama}</TableCell>
                  <TableCell>
                    <Badge variant={k.jenis === 'putra' ? 'default' : 'secondary'} className="capitalize text-xs">
                      {k.jenis}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#64748B]">{k.deskripsi || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{k.santriCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
