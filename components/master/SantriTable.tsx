'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatDateIndo } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, FileSpreadsheet, Search, Phone, Calendar, Building, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createSantriAction, updateSantriAction } from '@/actions/master.actions';
import { useRouter } from 'next/navigation';

interface SantriItem {
  id: string;
  nis: string;
  nama: string;
  komplekId: string;
  komplekKode: string;
  komplekNama: string;
  kategoriId: string;
  kategoriKode: string;
  kategoriNama: string;
  tanggalMasuk: string;
  status: 'aktif' | 'boyong';
  nomorWhatsapp: string;
  namaWali: string | null;
  nomorWhatsappWali: string | null;
  alamat: string | null;
}

interface SantriTableProps {
  initialSantri: SantriItem[];
  complexes: Array<{ id: string; kode: string; nama: string }>;
  categories: Array<{ id: string; kode: string; nama: string }>;
}

export function SantriTable({ initialSantri, complexes, categories }: SantriTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKomplek, setSelectedKomplek] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Santri Form
  const [formData, setFormData] = useState({
    nis: '',
    nama: '',
    komplekId: complexes[0]?.id || '',
    kategoriId: categories[0]?.id || '',
    tanggalMasuk: new Date().toISOString().split('T')[0],
    nomorWhatsapp: '',
    namaWali: '',
    nomorWhatsappWali: '',
    alamat: '',
    saldoAwalTabungan: 0,
  });

  const filteredSantri = initialSantri.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKomplek = selectedKomplek === 'all' || s.komplekId === selectedKomplek;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    return matchesSearch && matchesKomplek && matchesStatus;
  });

  const handleCreateSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const res = await createSantriAction(formData);
    if (!res.success) {
      setFormError(res.error || 'Gagal menambahkan santri');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsAddOpen(false);
    setFormData({
      nis: '',
      nama: '',
      komplekId: complexes[0]?.id || '',
      kategoriId: categories[0]?.id || '',
      tanggalMasuk: new Date().toISOString().split('T')[0],
      nomorWhatsapp: '',
      namaWali: '',
      nomorWhatsappWali: '',
      alamat: '',
      saldoAwalTabungan: 0,
    });
    router.refresh();
  };

  const handleToggleStatus = async (santriItem: SantriItem) => {
    const newStatus = santriItem.status === 'aktif' ? 'boyong' : 'aktif';
    const confirmMsg = santriItem.status === 'aktif'
      ? `Apakah Anda yakin ingin mengubah status ${santriItem.nama} menjadi BOYONG? Santri boyong tidak akan masuk tagihan massal berikutnya.`
      : `Aktifkan kembali ${santriItem.nama}?`;

    if (!confirm(confirmMsg)) return;

    await updateSantriAction({
      id: santriItem.id,
      status: newStatus,
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Action Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
            <Input
              placeholder="Cari berdasarkan NIS atau Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={selectedKomplek}
            onChange={(e) => setSelectedKomplek(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] shadow-sm"
          >
            <option value="all">Semua Komplek</option>
            {complexes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kode} - {c.nama}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] shadow-sm"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="boyong">Boyong</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/master/santri/impor">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 border-[#0F5132] text-[#0F5132] hover:bg-[#EBF5F0]">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Impor Excel</span>
            </Button>
          </Link>
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="h-9 text-xs gap-1.5 bg-[#0F5132] hover:bg-[#0B3D26] text-white">
            <UserPlus className="h-4 w-4" />
            <span>Tambah Santri</span>
          </Button>
        </div>
      </div>

      {/* Santri Directory Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NIS</TableHead>
              <TableHead>Nama Santri</TableHead>
              <TableHead>Komplek</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Tgl Masuk</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSantri.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-sm text-[#64748B]">
                  Tidak ada santri yang sesuai dengan kriteria pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredSantri.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-semibold text-[#0F172A]">
                    {s.nis}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-[#0F172A]">{s.nama}</div>
                    {s.namaWali && (
                      <div className="text-[11px] text-[#64748B]">Wali: {s.namaWali}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {s.komplekKode}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-[#475569]">{s.kategoriNama}</span>
                  </TableCell>
                  <TableCell className="text-xs text-[#64748B]">
                    {formatDateIndo(s.tanggalMasuk)}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://wa.me/${s.nomorWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#0F5132] hover:underline"
                    >
                      <Phone className="h-3 w-3 text-[#10B981]" />
                      <span>{s.nomorWhatsapp}</span>
                    </a>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(s)}
                      className="text-xs text-[#64748B] hover:text-[#0F172A]"
                    >
                      {s.status === 'aktif' ? 'Set Boyong' : 'Aktifkan'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Santri Modal Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Data Santri</DialogTitle>
            <DialogDescription>
              Santri baru akan otomatis dibuatkan akun login (username = NIS, password awal = password123).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSantri} className="space-y-4">
            {formError && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{formError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nis" className="text-xs">NIS (Wajib Unik)</Label>
                <Input
                  id="nis"
                  required
                  placeholder="Contoh: 2024010"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nama" className="text-xs">Nama Lengkap</Label>
                <Input
                  id="nama"
                  required
                  placeholder="Nama santri"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="komplekId" className="text-xs">Komplek Asrama</Label>
                <select
                  id="komplekId"
                  value={formData.komplekId}
                  onChange={(e) => setFormData({ ...formData, komplekId: e.target.value })}
                  className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs"
                >
                  {complexes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.kode} - {c.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kategoriId" className="text-xs">Kategori Santri</Label>
                <select
                  id="kategoriId"
                  value={formData.kategoriId}
                  onChange={(e) => setFormData({ ...formData, kategoriId: e.target.value })}
                  className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama} ({c.kode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tanggalMasuk" className="text-xs">Tanggal Masuk</Label>
                <Input
                  id="tanggalMasuk"
                  type="date"
                  required
                  value={formData.tanggalMasuk}
                  onChange={(e) => setFormData({ ...formData, tanggalMasuk: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nomorWhatsapp" className="text-xs">No WhatsApp Santri</Label>
                <Input
                  id="nomorWhatsapp"
                  required
                  placeholder="Contoh: 08123456789"
                  value={formData.nomorWhatsapp}
                  onChange={(e) => setFormData({ ...formData, nomorWhatsapp: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="namaWali" className="text-xs">Nama Wali (Opsional)</Label>
                <Input
                  id="namaWali"
                  placeholder="Nama orang tua/wali"
                  value={formData.namaWali}
                  onChange={(e) => setFormData({ ...formData, namaWali: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="saldoAwalTabungan" className="text-xs">Saldo Awal Tabungan (Rp)</Label>
                <Input
                  id="saldoAwalTabungan"
                  type="number"
                  placeholder="0"
                  value={formData.saldoAwalTabungan}
                  onChange={(e) => setFormData({ ...formData, saldoAwalTabungan: Number(e.target.value) })}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="bg-[#0F5132] hover:bg-[#0B3D26] text-white">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Santri'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
