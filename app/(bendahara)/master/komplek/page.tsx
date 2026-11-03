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
          <h1 className="text-2xl font-bold tracking-tight text-[#202119] font-sans">
            Data Komplek Asrama
          </h1>
          <p className="text-sm text-[#626262]">
            Daftar komplek pemukiman santri putra dan putri pondok pesantren.
          </p>
        </div>
      </div>

      {/* Grid of complexes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {complexes.map((k) => (
          <Card key={k.id} className="rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-white hover:border-[#202119]/30 transition-colors">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <Badge variant={k.jenis === 'putra' ? 'default' : 'secondary'} className="mb-2 uppercase text-[10px]">
                  {k.jenis}
                </Badge>
                <CardTitle className="text-base font-semibold text-[#202119]">
                  {k.nama}
                </CardTitle>
                <div className="text-xs font-mono font-bold text-[#202119] mt-0.5">
                  Kode: {k.kode}
                </div>
              </div>
              <div className="h-9 w-9 rounded-[10px] bg-[#F5F5F5] text-[#202119] flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#626262] mb-4 min-h-[32px]">
                {k.deskripsi || 'Tidak ada deskripsi komplek.'}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E8] text-xs">
                <span className="text-[#626262]">Jumlah Santri</span>
                <span className="font-semibold text-[#202119] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#202119]" />
                  {k.santriCount} santri
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card className="rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#202119]">Tabel Rincian Komplek</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F5F5]">
                <TableHead className="text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Kode</TableHead>
                <TableHead className="text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Nama Komplek</TableHead>
                <TableHead className="text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Jenis Asrama</TableHead>
                <TableHead className="text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Deskripsi</TableHead>
                <TableHead className="text-right text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Total Santri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complexes.map((k) => (
                <TableRow key={k.id} className="border-b border-[#E8E8E8]">
                  <TableCell className="font-mono font-bold text-[#202119]">{k.kode}</TableCell>
                  <TableCell className="font-semibold text-[#202119]">{k.nama}</TableCell>
                  <TableCell>
                    <Badge variant={k.jenis === 'putra' ? 'default' : 'secondary'} className="capitalize text-xs">
                      {k.jenis}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-[#626262]">{k.deskripsi || '-'}</TableCell>
                  <TableCell className="text-right font-medium text-[#202119]">{k.santriCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
