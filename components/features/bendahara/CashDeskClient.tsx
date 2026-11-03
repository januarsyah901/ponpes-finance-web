'use client';

import React, { useState, useMemo } from 'react';
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
import { formatRupiah, formatDateIndo, formatMonthYear } from '@/lib/formatters';
import { processCashPaymentAction } from '@/actions/payment.actions';
import {
  Search,
  User,
  Banknote,
  PiggyBank,
  CheckCircle,
  Printer,
  Share2,
  AlertTriangle,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface SantriOption {
  id: string;
  nis: string;
  nama: string;
  komplekId: string;
  komplekKode: string;
  komplekNama: string;
  kategoriNama: string;
  nomorWhatsapp: string;
  saldoTabungan: number;
}

interface BillData {
  id: string;
  santriId: string;
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

interface CashDeskClientProps {
  santriList: SantriOption[];
  allUnpaidBills: BillData[];
  defaultTarifNominal: number;
}

export function CashDeskClient({
  santriList,
  allUnpaidBills,
  defaultTarifNominal,
}: CashDeskClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SantriOption | null>(null);

  const [nominal, setNominal] = useState<number>(350000);
  const [nominalInput, setNominalInput] = useState<string>('350.000');
  const [tanggalBayar, setTanggalBayar] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [catatan, setCatatan] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  // Search filtered santri
  const matchingSantri = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return santriList
      .filter((s) => s.nama.toLowerCase().includes(query) || s.nis.includes(query))
      .slice(0, 8);
  }, [searchQuery, santriList]);

  // Unpaid bills for currently selected santri
  const santriUnpaidBills = useMemo(() => {
    if (!selectedSantri) return [];
    return allUnpaidBills
      .filter((b) => b.santriId === selectedSantri.id)
      .sort((a, b) => new Date(a.jatuhTempo).getTime() - new Date(b.jatuhTempo).getTime());
  }, [selectedSantri, allUnpaidBills]);

  const totalOutstanding = useMemo(() => {
    return santriUnpaidBills.reduce((acc, b) => acc + b.sisa, 0);
  }, [santriUnpaidBills]);

  const selectSantri = (s: SantriOption) => {
    setSelectedSantri(s);
    setSearchQuery('');
    const sBills = allUnpaidBills
      .filter((b) => b.santriId === s.id)
      .sort((a, b) => new Date(a.jatuhTempo).getTime() - new Date(b.jatuhTempo).getTime());

    const defaultAmount = sBills[0]?.sisa || defaultTarifNominal || 350000;
    setNominal(defaultAmount);
    setNominalInput(defaultAmount.toLocaleString('id-ID'));
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setNominal(num);
    setNominalInput(num > 0 ? num.toLocaleString('id-ID') : '');
  };

  const handleQuickNominal = (amount: number) => {
    setNominal(amount);
    setNominalInput(amount.toLocaleString('id-ID'));
  };

  // Live FIFO Allocation Simulation Preview
  const allocationPreview = useMemo(() => {
    if (!selectedSantri || nominal <= 0) return null;

    let rem = nominal;
    const items: Array<{
      tagihanId: string;
      judul: string;
      allocation: number;
      tabungan: number;
      operasional: number;
      sisaAfter: number;
      statusAfter: 'lunas' | 'sebagian';
    }> = [];

    let totalTab = 0;
    let totalOp = 0;

    for (const bill of santriUnpaidBills) {
      if (rem <= 0) break;
      const alloc = Math.min(rem, bill.sisa);

      let tab = 0;
      let op = alloc;

      if (bill.tipe === 'syahriah') {
        const neededTab = 50000; // estimated max needed
        tab = Math.min(alloc, neededTab);
        op = alloc - tab;
      }

      totalTab += tab;
      totalOp += op;
      rem -= alloc;

      items.push({
        tagihanId: bill.id,
        judul: bill.judul,
        allocation: alloc,
        tabungan: tab,
        operasional: op,
        sisaAfter: bill.sisa - alloc,
        statusAfter: bill.sisa - alloc === 0 ? 'lunas' : 'sebagian',
      });
    }

    let advanceSpillover = 0;
    if (rem > 0) {
      advanceSpillover = rem;
    }

    return {
      items,
      totalTabungan: totalTab,
      totalOperasional: totalOp,
      advanceSpillover,
    };
  }, [selectedSantri, nominal, santriUnpaidBills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) {
      setErrorMessage('Pilih santri terlebih dahulu');
      return;
    }

    if (nominal <= 0) {
      setErrorMessage('Nominal harus lebih dari Rp 0');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await processCashPaymentAction({
        santriId: selectedSantri.id,
        nominal,
        tanggalBayar,
        catatan: catatan.trim() || undefined,
      });

      if (!res.success) {
        throw new Error(res.error || 'Gagal memproses pembayaran kas');
      }

      setCompletedReceipt(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp deep link generator
  const getWhatsAppShareLink = () => {
    if (!completedReceipt) return '#';
    const s = completedReceipt.santri;
    let phone = s.nomorWhatsapp || '';
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);
    else if (phone.startsWith('8')) phone = '62' + phone;

    const rincianText = completedReceipt.alokasiRincian
      .map(
        (r: any) =>
          `• ${r.judul}: ${formatRupiah(r.nominalAlokasi || r.totalAllocated)} (${r.status === 'lunas' ? 'LUNAS' : 'SEBAGIAN'})`
      )
      .join('\n');

    const msg =
      `*KUITANSI PEMBAYARAN KAS PONDOK PESANTREN*\n` +
      `No. Kuitansi: ${completedReceipt.nomorKuitansi}\n` +
      `Tanggal: ${formatDateIndo(completedReceipt.tanggalBayar)}\n\n` +
      `*Santri:* ${s.nama} (${s.nis})\n` +
      `*Komplek:* ${s.komplekNama}\n` +
      `*Total Bayar:* ${formatRupiah(completedReceipt.nominalTotal)}\n\n` +
      `*Alokasi Dana:*\n` +
      `- Tabungan Santri: ${formatRupiah(completedReceipt.totalAlokasiTabungan)}\n` +
      `- Operasional Pondok: ${formatRupiah(completedReceipt.totalAlokasiOperasional)}\n\n` +
      `*Rincian Tagihan Terbayar:*\n${rincianText}\n\n` +
      `*Sisa Tunggakan:* ${formatRupiah(completedReceipt.sisaTunggakanSetelahBayar)}\n\n` +
      `Petugas: ${completedReceipt.petugasNama}\n` +
      `_Jazakumullahu khairan katsiran._`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#111111]">
          Meja Penerimaan Kas Tunai
        </h1>
        <p className="text-xs text-[#757575] mt-1">
          Pencatatan pembayaran tunai langsung di kantor bendahara dengan kuitansi instan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Intake */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Santri Selector Card */}
          <Card className="border-[rgba(0,0,0,0.08)] bg-white rounded-[12px] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-[#757575] uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-[#0075de]" />
                <span>Pilih Santri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Typeahead Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#757575]" />
                <Input
                  placeholder="Ketik NIS atau nama santri..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs border border-[rgba(0,0,0,0.12)] rounded-[8px] bg-white focus:ring-1 focus:ring-[#0075de] shadow-none"
                />
              </div>

              {/* Autocomplete Dropdown List */}
              {matchingSantri.length > 0 && (
                <div className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white shadow-none overflow-hidden divide-y divide-[rgba(0,0,0,0.08)] max-h-56 overflow-y-auto">
                  {matchingSantri.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSantri(s)}
                      className="w-full p-3 text-left hover:bg-[#e6f3fe]/50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-xs text-[#111111]">{s.nama}</div>
                        <div className="text-[11px] text-[#757575]">
                          NIS: <span className="font-mono">{s.nis}</span> • {s.komplekNama} ({s.kategoriNama})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#757575]">Saldo Tabungan</div>
                        <div className="text-xs font-bold font-mono text-[#0075de]">
                          {formatRupiah(s.saldoTabungan)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Santri Badge Card */}
              {selectedSantri && (
                <div className="p-4 rounded-[12px] bg-[#e6f3fe]/40 border border-[rgba(0,117,222,0.2)] flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#111111]">{selectedSantri.nama}</div>
                    <div className="text-xs text-[#757575] mt-0.5">
                      NIS: <span className="font-mono text-[#111111] font-semibold">{selectedSantri.nis}</span> • {selectedSantri.komplekNama}
                    </div>
                    <div className="text-[11px] text-[#757575] mt-1">
                      Kategori: <span className="font-medium text-[#111111]">{selectedSantri.kategoriNama}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-[#757575]">Saldo Tabungan</div>
                    <div className="font-mono font-bold text-sm text-[#0075de]">
                      {formatRupiah(selectedSantri.saldoTabungan)}
                    </div>
                    <div className="text-[10px] text-[#b47800] font-medium mt-1">
                      Tunggakan: {formatRupiah(totalOutstanding)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Payment Amount & Date Card */}
          {selectedSantri && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-[rgba(0,0,0,0.08)] bg-white rounded-[12px] shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold text-[#757575] uppercase tracking-wider flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#0075de]" />
                    <span>Nominal Pembayaran Tunai</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nominalTunai" className="text-xs font-semibold text-[#111111]">
                      Uang Diterima (Rp) <span className="text-[#e32d14]">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-sm text-[#757575]">
                        Rp
                      </span>
                      <Input
                        id="nominalTunai"
                        type="text"
                        inputMode="numeric"
                        value={nominalInput}
                        onChange={handleNominalChange}
                        placeholder="0"
                        className="pl-12 font-mono text-xl font-bold text-[#111111] border border-[rgba(0,0,0,0.12)] rounded-[8px] bg-white focus:ring-1 focus:ring-[#0075de] shadow-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Quick Pill Buttons */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {santriUnpaidBills[0] && (
                      <button
                        type="button"
                        onClick={() => handleQuickNominal(santriUnpaidBills[0].sisa)}
                        className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,0,0,0.08)] text-xs font-medium text-[#111111] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                      >
                        1 Bulan ({formatRupiah(santriUnpaidBills[0].sisa)})
                      </button>
                    )}

                    {totalOutstanding > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickNominal(totalOutstanding)}
                        className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,117,222,0.2)] bg-[#e6f3fe] text-xs font-semibold text-[#0075de] hover:bg-[#d5ebfd] transition-colors cursor-pointer"
                      >
                        Lunas Semua ({formatRupiah(totalOutstanding)})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleQuickNominal(500000)}
                      className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,0,0,0.08)] text-xs font-medium text-[#111111] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                    >
                      Rp 500.000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickNominal(1000000)}
                      className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,0,0,0.08)] text-xs font-medium text-[#111111] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                    >
                      Rp 1.000.000
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="tanggalBayarKas" className="text-xs font-semibold text-[#111111]">
                        Tanggal Pembayaran
                      </Label>
                      <Input
                        id="tanggalBayarKas"
                        type="date"
                        value={tanggalBayar}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setTanggalBayar(e.target.value)}
                        className="border border-[rgba(0,0,0,0.12)] rounded-[8px] bg-white focus:ring-1 focus:ring-[#0075de] shadow-none"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="catatanKas" className="text-xs font-semibold text-[#111111]">
                        Catatan (Opsional)
                      </Label>
                      <Input
                        id="catatanKas"
                        placeholder="Titipan wali santri, dll."
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        maxLength={250}
                        className="border border-[rgba(0,0,0,0.12)] rounded-[8px] bg-white focus:ring-1 focus:ring-[#0075de] shadow-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {errorMessage && (
                <div className="p-3 rounded-[12px] bg-[#fdeeed] border border-[#e32d14]/20 text-[#e32d14] text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || nominal <= 0}
                className="w-full h-12 bg-[#0075de] hover:bg-[#0060b8] text-white font-semibold text-sm rounded-[8px] shadow-none cursor-pointer"
              >
                {isSubmitting ? 'Memproses Kas & Alokasi...' : `Konfirmasi Penerimaan Kas (${formatRupiah(nominal)})`}
              </Button>
            </form>
          )}
        </div>

        {/* Right Column: Live FIFO Allocation Preview */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[rgba(0,0,0,0.08)] bg-white rounded-[12px] shadow-none sticky top-20">
            <CardHeader className="pb-3 border-b border-[rgba(0,0,0,0.08)]">
              <CardTitle className="text-xs font-semibold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#097fe8]" />
                <span>Simulasi Alokasi Otomatis (FIFO)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {!selectedSantri ? (
                <div className="text-center py-12 text-[#757575] text-xs">
                  <p>Pilih santri terlebih dahulu untuk melihat simulasi alokasi tagihan secara real-time.</p>
                </div>
              ) : !allocationPreview || allocationPreview.items.length === 0 ? (
                <div className="p-4 rounded-[12px] bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] text-xs text-[#757575] text-center">
                  Tidak ada tagihan tertunggak. Kelebihan pembayaran akan dialokasikan sebagai pembayaran di muka (bulan mendatang).
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {allocationPreview.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-[#f6f5f4] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-semibold text-[#111111]">
                          <span>{item.judul}</span>
                          <span className="font-mono text-[#0075de]">
                            {formatRupiah(item.allocation)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-[#757575]">
                          <div>
                            Tabungan: <span className="font-mono font-medium text-[#111111]">{formatRupiah(item.tabungan)}</span>
                          </div>
                          <div>
                            Operasional: <span className="font-mono font-medium text-[#111111]">{formatRupiah(item.operasional)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[rgba(0,0,0,0.08)]">
                          <span className={item.statusAfter === 'lunas' ? 'text-[#097fe8] font-semibold' : 'text-[#b47800] font-semibold'}>
                            Status: {item.statusAfter === 'lunas' ? 'Lunas' : 'Sebagian'}
                          </span>
                          <span className="text-[#757575]">
                            Sisa: {formatRupiah(item.sisaAfter)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allocationPreview.advanceSpillover > 0 && (
                    <div className="p-3 rounded-[12px] bg-[#e6f3fe] border border-[rgba(0,117,222,0.2)] text-xs text-[#111111] space-y-1">
                      <div className="font-semibold">Pembayaran di Muka (Kelebihan Dana):</div>
                      <div className="font-mono font-bold text-sm text-[#0075de]">
                        {formatRupiah(allocationPreview.advanceSpillover)}
                      </div>
                      <p className="text-[11px] text-[#097fe8]">
                        Otomatis dialokasikan ke tagihan syahriah bulan kalender berikutnya.
                      </p>
                    </div>
                  )}

                  {/* Summary Footer */}
                  <div className="pt-3 border-t border-[rgba(0,0,0,0.08)] space-y-1 text-xs">
                    <div className="flex justify-between text-[#757575]">
                      <span>Total Masuk Tabungan:</span>
                      <span className="font-mono font-bold text-[#0075de]">
                        {formatRupiah(allocationPreview.totalTabungan)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#757575]">
                      <span>Total Masuk Operasional:</span>
                      <span className="font-mono font-bold text-[#111111]">
                        {formatRupiah(allocationPreview.totalOperasional)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 80mm Thermal Receipt Dialog */}
      {completedReceipt && (
        <Dialog open={!!completedReceipt} onOpenChange={() => setCompletedReceipt(null)}>
          <DialogContent className="max-w-md w-full p-6 sm:rounded-[12px] bg-white text-[#111111] shadow-none border border-[rgba(0,0,0,0.08)]">
            <DialogHeader className="text-center pb-2 border-b border-dashed border-[rgba(0,0,0,0.08)]">
              <div className="font-bold text-base font-heading">PONDOK PESANTREN</div>
              <div className="text-[11px] text-[#757575]">Kuitansi Bukti Pembayaran Kas</div>
              <div className="font-mono text-xs font-semibold text-[#111111] mt-1">
                {completedReceipt.nomorKuitansi}
              </div>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#757575]">Tanggal:</span>
                <span>{formatDateIndo(completedReceipt.tanggalBayar)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757575]">Santri:</span>
                <span className="font-bold">{completedReceipt.santri.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757575]">NIS / Komplek:</span>
                <span>{completedReceipt.santri.nis} • {completedReceipt.santri.komplekKode}</span>
              </div>

              <div className="py-2 border-y border-dashed border-[rgba(0,0,0,0.08)] space-y-1.5">
                <div className="text-[10px] text-[#757575] uppercase">Rincian Alokasi:</div>
                {completedReceipt.alokasiRincian.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">{r.judul}</span>
                    <span className="font-bold">{formatRupiah(r.nominalAlokasi || r.totalAllocated)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-sm font-bold">
                  <span>TOTAL BAYAR:</span>
                  <span className="text-[#0075de]">{formatRupiah(completedReceipt.nominalTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#757575]">
                  <span>Masuk Tabungan:</span>
                  <span>{formatRupiah(completedReceipt.totalAlokasiTabungan)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#757575]">
                  <span>Masuk Operasional:</span>
                  <span>{formatRupiah(completedReceipt.totalAlokasiOperasional)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#b47800] font-semibold pt-1">
                  <span>Sisa Tunggakan:</span>
                  <span>{formatRupiah(completedReceipt.sisaTunggakanSetelahBayar)}</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-[#757575]">
                Petugas: {completedReceipt.petugasNama}<br />
                Simpan kuitansi ini sebagai bukti pembayaran sah.
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.08)]">
              <Button
                onClick={handlePrint}
                className="w-full bg-[#0075de] hover:bg-[#0060b8] text-white text-xs h-10 gap-2 cursor-pointer rounded-[8px] shadow-none"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Kuitansi (Thermal 80mm)</span>
              </Button>
              <a
                href={getWhatsAppShareLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full text-xs h-10 gap-2 border-[rgba(0,117,222,0.2)] text-[#0075de] hover:bg-[#e6f3fe] cursor-pointer rounded-[8px] shadow-none"
                >
                  <Share2 className="h-4 w-4 text-[#0075de]" />
                  <span>Kirim Kuitansi ke WhatsApp</span>
                </Button>
              </a>
              <Button
                variant="ghost"
                onClick={() => {
                  setCompletedReceipt(null);
                  setSelectedSantri(null);
                  setNominalInput('');
                  setNominal(0);
                }}
                className="text-xs text-[#757575] hover:bg-[rgba(55,53,47,0.06)] rounded-[8px]"
              >
                Tutup & Transaksi Berikutnya
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
