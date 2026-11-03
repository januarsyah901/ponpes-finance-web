'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatDateIndo, formatRupiah, INDO_MONTHS } from '@/lib/formatters';
import { generateBulkSyahriahAction } from '@/actions/billing.actions';
import {
  Receipt,
  PlusCircle,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface BillRow {
  id: string;
  santriId: string;
  santriNis: string;
  santriNama: string;
  komplekId: string;
  komplekKode: string;
  komplekNama: string;
  tipe: 'syahriah' | 'kegiatan';
  judul: string;
  bulan: number | null;
  tahun: number | null;
  jatuhTempo: string;
  nominal: number;
  terbayar: number;
  sisa: number;
  status: string;
}

interface ComplexItem {
  id: string;
  kode: string;
  nama: string;
}

interface BillingPageClientProps {
  initialBills: BillRow[];
  complexList: ComplexItem[];
  currentBulan: number;
  currentTahun: number;
}

export function BillingPageClient({
  initialBills,
  complexList,
  currentBulan,
  currentTahun,
}: BillingPageClientProps) {
  const [bills, setBills] = useState(initialBills);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKomplekId, setSelectedKomplekId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [genBulan, setGenBulan] = useState<number>(currentBulan);
  const [genTahun, setGenTahun] = useState<number>(currentTahun);
  const [genKomplekId, setGenKomplekId] = useState<string>('all');
  const [genJatuhTempo, setGenJatuhTempo] = useState<string>(
    `${currentTahun}-${String(currentBulan).padStart(2, '0')}-10`
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.santriNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.santriNis.includes(searchQuery) ||
      b.judul.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesKomplek =
      selectedKomplekId === 'all' || b.komplekId === selectedKomplekId;

    const matchesStatus =
      selectedStatus === 'all' || b.status === selectedStatus;

    return matchesSearch && matchesKomplek && matchesStatus;
  });

  const handleOpenModal = () => {
    setGenerationResult(null);
    setGenerationError(null);
    setIsModalOpen(true);
  };

  const handleBulanChange = (m: number) => {
    setGenBulan(m);
    setGenJatuhTempo(`${genTahun}-${String(m).padStart(2, '0')}-10`);
  };

  const handleTahunChange = (y: number) => {
    setGenTahun(y);
    setGenJatuhTempo(`${y}-${String(genBulan).padStart(2, '0')}-10`);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationResult(null);

    try {
      const payload: any = {
        bulan: genBulan,
        tahun: genTahun,
        jatuhTempo: genJatuhTempo,
      };

      if (genKomplekId !== 'all') {
        payload.komplekId = genKomplekId;
      }

      const res = await generateBulkSyahriahAction(payload);
      if (!res.success) {
        throw new Error(res.error || 'Gagal menghasilkan tagihan syahriah masal');
      }

      setGenerationResult(res);
      if ((res as any).billsCreated && (res as any).billsCreated.length > 0) {
        // Full refresh recommended via page reload
      }
    } catch (err: any) {
      setGenerationError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-sans text-[#202119]">
            Daftar Tagihan Santri
          </h1>
          <p className="text-xs text-[#626262] mt-1">
            Kelola tagihan bulanan syahriah dan tagihan kegiatan seluruh santri
          </p>
        </div>

        <Button
          onClick={handleOpenModal}
          className="bg-[#202119] hover:bg-[#2e2f26] text-white font-semibold text-xs h-10 gap-2 shadow-none cursor-pointer rounded-[8px] focus-visible:ring-[#315FC4]"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Tagihan Syahriah Masal</span>
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="border border-[#E8E8E8] bg-white rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#747474]" />
              <Input
                placeholder="Cari santri, NIS, atau judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs border border-[#E8E8E8] rounded-[8px] bg-white text-[#202119] placeholder:text-[#747474] focus-visible:ring-[#315FC4] shadow-none"
              />
            </div>

            {/* Complex Filter */}
            <div>
              <select
                value={selectedKomplekId}
                onChange={(e) => setSelectedKomplekId(e.target.value)}
                aria-label="Filter berdasarkan komplek"
                className="w-full h-10 px-3 rounded-[8px] border border-[#E8E8E8] bg-white text-xs font-medium text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4]"
              >
                <option value="all">Semua Komplek</option>
                {complexList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.kode} - {c.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter berdasarkan status"
                className="w-full h-10 px-3 rounded-[8px] border border-[#E8E8E8] bg-white text-xs font-medium text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4]"
              >
                <option value="all">Semua Status</option>
                <option value="belum_bayar">Belum Bayar</option>
                <option value="sebagian">Sebagian (Cicilan)</option>
                <option value="lunas">Lunas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card className="border border-[#E8E8E8] bg-white overflow-hidden rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E8E8E8] bg-[#F5F5F5]">
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Tagihan</th>
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Santri</th>
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Komplek</th>
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Jatuh Tempo</th>
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Nominal</th>
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Terbayar</th>
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Sisa</th>
                <th className="py-3 px-4 text-[#626262] text-xs font-medium uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#626262]">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="h-8 w-8 text-[#626262]" />
                      <p className="font-semibold text-[#202119]">Tidak ada tagihan yang cocok</p>
                      <p className="text-xs">Ubah filter pencarian atau buat tagihan masal baru</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#202119] whitespace-nowrap">
                      {b.judul}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#202119]">{b.santriNama}</div>
                      <div className="font-mono text-[11px] text-[#626262]">{b.santriNis}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F5] border border-[#E8E8E8] text-[#202119]">
                        {b.komplekKode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#626262] whitespace-nowrap">
                      {formatDateIndo(b.jatuhTempo)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-medium text-[#202119]">
                      <CurrencyDisplay amount={b.nominal} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[#2B8A60]">
                      <CurrencyDisplay amount={b.terbayar} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-[#202119]">
                      <CurrencyDisplay amount={b.sisa} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mass Generation Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md w-full p-6 sm:rounded-[18px] bg-white text-[#202119] border border-[#E8E8E8]">
          <DialogHeader className="pb-3 border-b border-[#E8E8E8]">
            <DialogTitle className="text-base font-bold font-sans text-[#202119] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#F4512A]" />
              <span>Generate Tagihan Syahriah Masal</span>
            </DialogTitle>
          </DialogHeader>

          {generationResult ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-[18px] bg-[#EAF7EF] border border-[rgba(43,138,96,0.2)] text-[#202119] space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#2B8A60]">
                  <CheckCircle className="h-4 w-4" />
                  <span>Proses Pembuatan Tagihan Selesai!</span>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Total Santri Aktif Sasaran:</span>
                    <span className="font-bold">{generationResult.totalActiveSantri}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tagihan Baru Dibuat:</span>
                    <span className="font-bold text-[#2B8A60]">{generationResult.newlyBilledCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sudah Memiliki Tagihan (Dilewati):</span>
                    <span className="font-bold text-[#626262]">{generationResult.alreadyBilledCount}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[rgba(43,138,96,0.2)]">
                    <span>Total Nominal Tagihan Baru:</span>
                    <span className="font-mono font-bold text-[#2B8A60]">
                      {formatRupiah(generationResult.totalNominalBilled)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  window.location.reload();
                }}
                className="w-full bg-[#202119] hover:bg-[#2e2f26] text-white text-xs h-10 font-semibold cursor-pointer rounded-[8px] shadow-none focus-visible:ring-[#315FC4]"
              >
                Selesai &amp; Muat Ulang Daftar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#202119]">
                  Pilih Bulan Tagihan
                </Label>
                <select
                  value={genBulan}
                  onChange={(e) => handleBulanChange(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-[8px] border border-[#E8E8E8] bg-white text-xs font-medium text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4]"
                >
                  {INDO_MONTHS.map((name, idx) => (
                    <option key={idx} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#202119]">
                  Tahun Tagihan
                </Label>
                <Input
                  type="number"
                  value={genTahun}
                  min={2020}
                  max={2030}
                  onChange={(e) => handleTahunChange(Number(e.target.value))}
                  className="text-xs border border-[#E8E8E8] rounded-[8px] bg-white text-[#202119] focus-visible:ring-[#315FC4] shadow-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#202119]">
                  Sasaran Komplek
                </Label>
                <select
                  value={genKomplekId}
                  onChange={(e) => setGenKomplekId(e.target.value)}
                  className="w-full h-10 px-3 rounded-[8px] border border-[#E8E8E8] bg-white text-xs font-medium text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4]"
                >
                  <option value="all">Semua Komplek</option>
                  {complexList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.kode} - {c.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-[#202119]">
                  Tanggal Jatuh Tempo (Default: Tgl 10)
                </Label>
                <Input
                  type="date"
                  value={genJatuhTempo}
                  onChange={(e) => setGenJatuhTempo(e.target.value)}
                  className="text-xs border border-[#E8E8E8] rounded-[8px] bg-white text-[#202119] focus-visible:ring-[#315FC4] shadow-none"
                  required
                />
              </div>

              {generationError && (
                <div className="p-3 rounded-[18px] bg-[#FCEDEF] border border-[rgba(200,76,90,0.2)] text-[#C84C5A] text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 text-xs h-10 cursor-pointer border border-[#E8E8E8] bg-white text-[#202119] rounded-[8px] shadow-none hover:bg-[#F5F5F5]"
                  disabled={isGenerating}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 bg-[#202119] hover:bg-[#2e2f26] text-white text-xs font-semibold h-10 cursor-pointer rounded-[8px] shadow-none focus-visible:ring-[#315FC4]"
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    <span>Mulai Generate</span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
