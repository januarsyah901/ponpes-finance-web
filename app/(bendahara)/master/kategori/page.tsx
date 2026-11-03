export const dynamic = 'force-dynamic';

import { getKategoriList } from '@/actions/master.actions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tags, Users } from 'lucide-react';

export default async function KategoriMasterPage() {
  const categories = await getKategoriList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#202119] font-sans">
          Kategori Santri
        </h1>
        <p className="text-sm text-[#626262]">
          Kategori santri menentukan jadwal tarif syahriah serta syarat kelayakan subsidi pondok.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((c) => (
          <Card key={c.id} className="rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-white">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <Badge variant="secondary" className="mb-2 font-mono text-[10px]">
                  {c.kode}
                </Badge>
                <CardTitle className="text-base font-semibold text-[#202119]">
                  {c.nama}
                </CardTitle>
              </div>
              <div className="h-9 w-9 rounded-[10px] bg-[#F5F5F5] text-[#202119] flex items-center justify-center shrink-0">
                <Tags className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#626262] mb-4 min-h-[32px]">
                {c.deskripsi || 'Tidak ada deskripsi kategori.'}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#E8E8E8] text-xs">
                <span className="text-[#626262]">Santri Terdaftar</span>
                <span className="font-semibold text-[#202119] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#202119]" />
                  {c.santriCount} santri
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#202119]">Tabel Kategori Santri</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F5F5]">
                <TableHead className="text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Kode Enum</TableHead>
                <TableHead className="text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Nama Kategori</TableHead>
                <TableHead className="text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Deskripsi Peran</TableHead>
                <TableHead className="text-right text-[#626262] text-xs font-medium uppercase tracking-wider border-b border-[#E8E8E8]">Total Santri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id} className="border-b border-[#E8E8E8]">
                  <TableCell className="font-mono text-xs font-semibold text-[#202119]">
                    {c.kode}
                  </TableCell>
                  <TableCell className="font-semibold text-[#202119]">{c.nama}</TableCell>
                  <TableCell className="text-xs text-[#626262]">{c.deskripsi || '-'}</TableCell>
                  <TableCell className="text-right font-medium text-[#202119]">{c.santriCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
