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
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
          Kategori Santri
        </h1>
        <p className="text-sm text-[#64748B]">
          Kategori santri menentukan jadwal tarif syahriah serta syarat kelayakan subsidi pondok.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((c) => (
          <Card key={c.id} className="border-[#E2E8F0] bg-white">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <Badge variant="secondary" className="mb-2 font-mono text-[10px]">
                  {c.kode}
                </Badge>
                <CardTitle className="text-base font-semibold text-[#0F172A]">
                  {c.nama}
                </CardTitle>
              </div>
              <div className="h-9 w-9 rounded-xl bg-[#EBF5F0] text-[#0F5132] flex items-center justify-center shrink-0">
                <Tags className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#64748B] mb-4 min-h-[32px]">
                {c.deskripsi || 'Tidak ada deskripsi kategori.'}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0] text-xs">
                <span className="text-[#64748B]">Santri Terdaftar</span>
                <span className="font-semibold text-[#0F172A] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#0F5132]" />
                  {c.santriCount} santri
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Tabel Kategori Santri</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Enum</TableHead>
                <TableHead>Nama Kategori</TableHead>
                <TableHead>Deskripsi Peran</TableHead>
                <TableHead className="text-right">Total Santri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-semibold text-[#0F5132]">
                    {c.kode}
                  </TableCell>
                  <TableCell className="font-semibold">{c.nama}</TableCell>
                  <TableCell className="text-xs text-[#64748B]">{c.deskripsi || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{c.santriCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
