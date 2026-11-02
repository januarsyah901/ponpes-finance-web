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
        <h1 className="text-2xl font-bold font-heading text-[#0F172A]">
          Meja Penerimaan Kas Tunai
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Pencatatan pembayaran tunai langsung di kantor bendahara dengan kuitansi instan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Intake */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Santri Selector Card */}
          <Card className="border-[#E2E8F0] bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-[#0F5132]" />
                <span>Pilih Santri</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Typeahead Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <Input
                  placeholder="Ketik NIS atau nama santri..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Autocomplete Dropdown List */}
              {matchingSantri.length > 0 && (
                <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-lg overflow-hidden divide-y divide-[#E2E8F0] max-h-56 overflow-y-auto">
                  {matchingSantri.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSantri(s)}
                      className="w-full p-3 text-left hover:bg-[#EBF5F0]/50 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-xs text-[#0F172A]">{s.nama}</div>
                        <div className="text-[11px] text-[#64748B]">
                          NIS: <span className="font-mono">{s.nis}</span> • {s.komplekNama} ({s.kategoriNama})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-[#64748B]">Saldo Tabungan</div>
                        <div className="text-xs font-bold font-mono text-[#0F5132]">
                          {formatRupiah(s.saldoTabungan)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Santri Badge Card */}
              {selectedSantri && (
                <div className="p-4 rounded-xl bg-[#EBF5F0]/40 border border-[#0F5132]/30 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#0F172A]">{selectedSantri.nama}</div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      NIS: <span className="font-mono text-[#0F172A] font-semibold">{selectedSantri.nis}</span> • {selectedSantri.komplekNama}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-1">
                      Kategori: <span className="font-medium text-[#0F172A]">{selectedSantri.kategoriNama}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-semibold text-[#64748B]">Saldo Tabungan</div>
                    <div className="font-mono font-bold text-sm text-[#0F5132]">
                      {formatRupiah(selectedSantri.saldoTabungan)}
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium mt-1">
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
              <Card className="border-[#E2E8F0] bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#0F5132]" />
                    <span>Nominal Pembayaran Tunai</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nominalTunai" className="text-xs font-semibold text-[#0F172A]">
                      Uang Diterima (Rp) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-sm text-[#64748B]">
                        Rp
                      </span>
                      <Input
                        id="nominalTunai"
                        type="text"
                        inputMode="numeric"
                        value={nominalInput}
                        onChange={handleNominalChange}
                        placeholder="0"
                        className="pl-12 font-mono text-xl font-bold text-[#0F172A]"
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
                        className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        1 Bulan ({formatRupiah(santriUnpaidBills[0].sisa)})
                      </button>
                    )}

                    {totalOutstanding > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickNominal(totalOutstanding)}
                        className="px-3 py-1.5 rounded-lg border border-[#0F5132]/30 bg-[#EBF5F0] text-xs font-semibold text-[#0F5132] hover:bg-[#EBF5F0]/80 transition-colors cursor-pointer"
                      >
                        Lunas Semua ({formatRupiah(totalOutstanding)})
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleQuickNominal(500000)}
                      className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Rp 500.000
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickNominal(1000000)}
                      className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Rp 1.000.000
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="tanggalBayarKas" className="text-xs font-semibold text-[#0F172A]">
                        Tanggal Pembayaran
                      </Label>
                      <Input
                        id="tanggalBayarKas"
                        type="date"
                        value={tanggalBayar}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setTanggalBayar(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="catatanKas" className="text-xs font-semibold text-[#0F172A]">
                        Catatan (Opsional)
                      </Label>
                      <Input
                        id="catatanKas"
                        placeholder="Titipan wali santri, dll."
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        maxLength={250}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || nominal <= 0}
                className="w-full h-12 bg-[#0F5132] hover:bg-[#0F5132]/90 text-white font-semibold text-sm rounded-xl shadow-md cursor-pointer"
              >
                {isSubmitting ? 'Memproses Kas & Alokasi...' : `Konfirmasi Penerimaan Kas (${formatRupiah(nominal)})`}
              </Button>
            </form>
          )}
        </div>

        {/* Right Column: Live FIFO Allocation Preview */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-[#E2E8F0] bg-white sticky top-20">
            <CardHeader className="pb-3 border-b border-[#E2E8F0]">
              <CardTitle className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#10B981]" />
                <span>Simulasi Alokasi Otomatis (FIFO)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {!selectedSantri ? (
                <div className="text-center py-12 text-[#64748B] text-xs">
                  <p>Pilih santri terlebih dahulu untuk melihat simulasi alokasi tagihan secara real-time.</p>
                </div>
              ) : !allocationPreview || allocationPreview.items.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#64748B] text-center">
                  Tidak ada tagihan tertunggak. Kelebihan pembayaran akan dialokasikan sebagai pembayaran di muka (bulan mendatang).
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {allocationPreview.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-semibold text-[#0F172A]">
                          <span>{item.judul}</span>
                          <span className="font-mono text-[#0F5132]">
                            {formatRupiah(item.allocation)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-[#64748B]">
                          <div>
                            Tabungan: <span className="font-mono font-medium text-[#0F172A]">{formatRupiah(item.tabungan)}</span>
                          </div>
                          <div>
                            Operasional: <span className="font-mono font-medium text-[#0F172A]">{formatRupiah(item.operasional)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200">
                          <span className={item.statusAfter === 'lunas' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                            Status: {item.statusAfter === 'lunas' ? 'Lunas' : 'Sebagian'}
                          </span>
                          <span className="text-[#64748B]">
                            Sisa: {formatRupiah(item.sisaAfter)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allocationPreview.advanceSpillover > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-semibold">Pembayaran di Muka (Kelebihan Dana):</div>
                      <div className="font-mono font-bold text-sm text-[#0F5132]">
                        {formatRupiah(allocationPreview.advanceSpillover)}
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Otomatis dialokasikan ke tagihan syahriah bulan kalender berikutnya.
                      </p>
                    </div>
                  )}

                  {/* Summary Footer */}
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-1 text-xs">
                    <div className="flex justify-between text-[#64748B]">
                      <span>Total Masuk Tabungan:</span>
                      <span className="font-mono font-bold text-[#0F5132]">
                        {formatRupiah(allocationPreview.totalTabungan)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#64748B]">
                      <span>Total Masuk Operasional:</span>
                      <span className="font-mono font-bold text-[#0F172A]">
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
          <DialogContent className="max-w-md w-full p-6 sm:rounded-2xl bg-white text-[#0F172A]">
            <DialogHeader className="text-center pb-2 border-b border-dashed border-slate-300">
              <div className="font-bold text-base font-heading">PONDOK PESANTREN</div>
              <div className="text-[11px] text-[#64748B]">Kuitansi Bukti Pembayaran Kas</div>
              <div className="font-mono text-xs font-semibold text-[#0F172A] mt-1">
                {completedReceipt.nomorKuitansi}
              </div>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Tanggal:</span>
                <span>{formatDateIndo(completedReceipt.tanggalBayar)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Santri:</span>
                <span className="font-bold">{completedReceipt.santri.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">NIS / Komplek:</span>
                <span>{completedReceipt.santri.nis} • {completedReceipt.santri.komplekKode}</span>
              </div>

              <div className="py-2 border-y border-dashed border-slate-300 space-y-1.5">
                <div className="text-[10px] text-[#64748B] uppercase">Rincian Alokasi:</div>
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
                  <span className="text-[#0F5132]">{formatRupiah(completedReceipt.nominalTotal)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>Masuk Tabungan:</span>
                  <span>{formatRupiah(completedReceipt.totalAlokasiTabungan)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>Masuk Operasional:</span>
                  <span>{formatRupiah(completedReceipt.totalAlokasiOperasional)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-700 font-semibold pt-1">
                  <span>Sisa Tunggakan:</span>
                  <span>{formatRupiah(completedReceipt.sisaTunggakanSetelahBayar)}</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-[#64748B]">
                Petugas: {completedReceipt.petugasNama}<br />
                Simpan kuitansi ini sebagai bukti pembayaran sah.
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <Button
                onClick={handlePrint}
                className="w-full bg-[#0F5132] hover:bg-[#0F5132]/90 text-white text-xs h-10 gap-2 cursor-pointer"
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
                  className="w-full text-xs h-10 gap-2 border-emerald-600 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                >
                  <Share2 className="h-4 w-4 text-emerald-600" />
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
                className="text-xs text-[#64748B]"
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
