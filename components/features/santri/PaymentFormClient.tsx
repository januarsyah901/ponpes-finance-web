'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProofUploader } from '@/components/domain/ProofUploader';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { CompressionResult } from '@/lib/image-compression';
import { submitPaymentAction } from '@/actions/payment.actions';
import {
  Building2,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface BillItem {
  id: string;
  judul: string;
  tipe: 'syahriah' | 'kegiatan';
  bulan: number | null;
  tahun: number | null;
  jatuhTempo: string;
  nominal: number;
  terbayar: number;
  sisa: number;
  status: string;
}

interface PaymentFormClientProps {
  santriId: string;
  profile: {
    id: string;
    nis: string;
    nama: string;
    komplekId: string;
    komplekNama: string;
    kategoriNama: string;
  };
  unpaidBills: BillItem[];
  lastRejected: {
    id: string;
    nominal: number;
    tanggalBayar: string;
    alasanPenolakan: string | null;
    updatedAt: Date;
  } | null;
}

export function PaymentFormClient({
  santriId,
  profile,
  unpaidBills,
  lastRejected,
}: PaymentFormClientProps) {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  // Form State
  const [selectedBillId, setSelectedBillId] = useState<string>('auto');
  const [nominal, setNominal] = useState<number>(() => {
    return unpaidBills[0]?.sisa || 350000;
  });
  const [nominalInput, setNominalInput] = useState<string>(() => {
    return (unpaidBills[0]?.sisa || 350000).toLocaleString('id-ID');
  });
  const [tanggalBayar, setTanggalBayar] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [catatanSantri, setCatatanSantri] = useState<string>('');
  const [compressedProof, setCompressedProof] = useState<CompressionResult | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const totalOutstanding = unpaidBills.reduce((acc, b) => acc + b.sisa, 0);

  const copyToClipboard = (text: string, bankKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bankKey);
    setTimeout(() => setCopiedBank(null), 2500);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (nominal <= 0) {
      setErrorMessage('Nominal pembayaran harus lebih dari Rp 0');
      return;
    }

    if (!compressedProof) {
      setErrorMessage('Harap unggah foto bukti transfer terlebih dahulu');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload compressed proof image via /api/upload
      const formData = new FormData();
      formData.append('file', compressedProof.file);
      formData.append('santriId', santriId);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || 'Gagal mengunggah foto bukti ke server');
      }

      // 2. Submit payment record via Server Action
      const submitRes = await submitPaymentAction({
        santriId,
        nominal,
        tanggalBayar,
        catatanSantri: catatanSantri.trim() || undefined,
        buktiUrl: uploadJson.url,
      });

      if (!submitRes.success || !submitRes.data) {
        throw new Error(submitRes.error || 'Gagal mengirim konfirmasi pembayaran');
      }

      setSuccessReceipt({
        id: submitRes.data.id,
        nominal: submitRes.data.nominal,
        tanggalBayar: submitRes.data.tanggalBayar,
        status: submitRes.data.status,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat memproses pembayaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  // State C: Success Receipt Confirmation
  if (successReceipt) {
    return (
      <div className="bg-white rounded-[12px] border border-[rgba(0,0,0,0.08)] p-6 shadow-none text-center space-y-5">
        <div className="h-16 w-16 bg-[#ebf5ee] rounded-full flex items-center justify-center mx-auto text-[#2b6e4f]">
          <CheckCircle className="h-10 w-10 text-[#2b6e4f]" />
        </div>

        <div>
          <h2 className="text-xl font-bold font-heading text-[#111111]">
            Bukti Transfer Berhasil Dikirim!
          </h2>
          <p className="text-xs text-[#757575] mt-1 max-w-md mx-auto">
            Pembayaran Anda telah masuk ke antrean verifikasi bendahara komplek. Mohon menunggu proses verifikasi.
          </p>
        </div>

        {/* Receipt Card */}
        <div className="bg-[#f6f5f4] rounded-[8px] p-4 border border-[rgba(0,0,0,0.08)] text-left space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-[rgba(0,0,0,0.08)]">
            <span className="text-[#757575]">Santri:</span>
            <span className="font-semibold text-[#111111]">{profile.nama} ({profile.nis})</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[rgba(0,0,0,0.08)]">
            <span className="text-[#757575]">Tanggal Bayar:</span>
            <span className="font-medium text-[#111111]">{formatDateIndo(successReceipt.tanggalBayar)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[rgba(0,0,0,0.08)]">
            <span className="text-[#757575]">Nominal:</span>
            <CurrencyDisplay amount={successReceipt.nominal} className="font-bold text-[#0075de]" />
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[#757575]">Status:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff6e5] text-[#b47800] border border-[#fde2a7]">
              Menunggu Verifikasi
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/santri" className="flex-1">
            <Button variant="outline" className="w-full rounded-[8px]">
              Kembali ke Beranda
            </Button>
          </Link>
          <Link href="/santri" className="flex-1">
            <Button className="w-full bg-[#0075de] hover:bg-[#0060b8] text-white rounded-[8px]">
              Lihat Tagihan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#111111]">
          Konfirmasi Pembayaran
        </h1>
        <p className="text-xs text-[#757575] mt-1">
          Kirim bukti transfer bank untuk verifikasi tagihan syahriah & kegiatan santri
        </p>
      </div>

      {/* Rejection Alert Banner (if applicable) */}
      {lastRejected && (
        <div className="p-4 rounded-[8px] bg-[#fdeeed] border border-[rgba(227,45,20,0.2)] text-[#e32d14] space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs text-[#e32d14]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Pembayaran Terakhir Anda Ditolak</span>
          </div>
          <p className="text-xs text-[#e32d14]">
            <strong>Alasan Bendahara:</strong> &ldquo;{lastRejected.alasanPenolakan}&rdquo;
          </p>
          <p className="text-[11px] text-[#e32d14]">
            Silakan periksa kembali mutasi bank dan unggah foto bukti transfer yang jelas dan terbaca.
          </p>
        </div>
      )}

      {/* Bank Account Information Cards */}
      <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0075de]" />
            <span>Rekening Resmi Pondok Pesantren</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BSI */}
          <div className="p-3 rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[#f6f5f4] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-[#0075de]">Bank Syariah Indonesia (BSI)</div>
              <div className="font-mono text-sm font-bold text-[#111111] mt-0.5">7123456789</div>
              <div className="text-[10px] text-[#757575]">a.n. Pondok Pesantren</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('7123456789', 'BSI')}
              className="p-2 rounded-[6px] bg-white border border-[rgba(0,0,0,0.12)] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
              title="Salin Nomor Rekening"
            >
              {copiedBank === 'BSI' ? (
                <Check className="h-4 w-4 text-[#2b6e4f]" />
              ) : (
                <Copy className="h-4 w-4 text-[#757575]" />
              )}
            </button>
          </div>

          {/* BCA */}
          <div className="p-3 rounded-[8px] border border-[rgba(0,0,0,0.08)] bg-[#f6f5f4] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-[#0075de]">Bank BCA</div>
              <div className="font-mono text-sm font-bold text-[#111111] mt-0.5">8901234567</div>
              <div className="text-[10px] text-[#757575]">a.n. Yayasan Pondok Pesantren</div>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('8901234567', 'BCA')}
              className="p-2 rounded-[6px] bg-white border border-[rgba(0,0,0,0.12)] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
              title="Salin Nomor Rekening"
            >
              {copiedBank === 'BCA' ? (
                <Check className="h-4 w-4 text-[#2b6e4f]" />
              ) : (
                <Copy className="h-4 w-4 text-[#757575]" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Bill Selection & Outstanding Notice */}
      <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider flex items-center justify-between">
            <span>Pilih Target Tagihan</span>
            <span className="text-[11px] font-normal normal-case text-[#0075de]">
              Total Tunggakan: <CurrencyDisplay amount={totalOutstanding} />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Default FIFO Option */}
          <label className={`flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${
            selectedBillId === 'auto'
              ? 'border-[#0075de] bg-[#e6f3fe]/40'
              : 'border-[rgba(0,0,0,0.08)] hover:bg-[#f6f5f4]'
          }`}>
            <input
              type="radio"
              name="targetBill"
              value="auto"
              checked={selectedBillId === 'auto'}
              onChange={() => setSelectedBillId('auto')}
              className="mt-1 accent-[#0075de]"
            />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-[#111111] flex items-center gap-1.5">
                <span>Alokasi Otomatis (Rekomendasi)</span>
                <Sparkles className="h-3.5 w-3.5 text-[#0075de]" />
              </div>
              <p className="text-[#757575] mt-0.5">
                Pembayaran dialokasikan otomatis ke tagihan bulan terlama terlebih dahulu (FIFO).
              </p>
            </div>
          </label>

          {/* Specific Bills List */}
          {unpaidBills.map((bill) => (
            <label
              key={bill.id}
              className={`flex items-start gap-3 p-3 rounded-[8px] border cursor-pointer transition-colors ${
                selectedBillId === bill.id
                  ? 'border-[#0075de] bg-[#e6f3fe]/40'
                  : 'border-[rgba(0,0,0,0.08)] hover:bg-[#f6f5f4]'
              }`}
            >
              <input
                type="radio"
                name="targetBill"
                value={bill.id}
                checked={selectedBillId === bill.id}
                onChange={() => {
                  setSelectedBillId(bill.id);
                  handleQuickNominal(bill.sisa);
                }}
                className="mt-1 accent-[#0075de]"
              />
              <div className="flex-1 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#111111]">{bill.judul}</div>
                  <div className="text-[11px] text-[#757575]">Jatuh tempo: {formatDateIndo(bill.jatuhTempo)}</div>
                </div>
                <div className="text-right">
                  <CurrencyDisplay amount={bill.sisa} className="font-bold text-[#111111]" />
                  <div className="text-[10px] text-[#b47800] font-medium">Sisa Tagihan</div>
                </div>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Nominal Input & Quick Buttons */}
      <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white shadow-none">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nominal" className="text-xs font-semibold text-[#111111]">
              Nominal yang Ditransfer (Rp) <span className="text-[#e32d14]">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-sm text-[#757575]">
                Rp
              </span>
              <Input
                id="nominal"
                type="text"
                inputMode="numeric"
                value={nominalInput}
                onChange={handleNominalChange}
                placeholder="0"
                className="pl-12 font-mono text-lg font-bold text-[#111111] border-[rgba(0,0,0,0.12)] rounded-[8px]"
                required
              />
            </div>
          </div>

          {/* Quick Pill Buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {unpaidBills[0] && (
              <button
                type="button"
                onClick={() => handleQuickNominal(unpaidBills[0].sisa)}
                className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-xs font-medium text-[#111111] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
              >
                1 Bulan ({formatRupiah(unpaidBills[0].sisa)})
              </button>
            )}

            {totalOutstanding > 0 && totalOutstanding !== (unpaidBills[0]?.sisa || 0) && (
              <button
                type="button"
                onClick={() => handleQuickNominal(totalOutstanding)}
                className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,117,222,0.3)] bg-[#e6f3fe] text-xs font-semibold text-[#0075de] hover:bg-[#d5ebfd] transition-colors cursor-pointer"
              >
                Lunas Semua ({formatRupiah(totalOutstanding)})
              </button>
            )}

            <button
              type="button"
              onClick={() => handleQuickNominal(500000)}
              className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-xs font-medium text-[#111111] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
            >
              Rp 500.000
            </button>
            <button
              type="button"
              onClick={() => handleQuickNominal(1000000)}
              className="px-3 py-1.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-xs font-medium text-[#111111] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
            >
              Rp 1.000.000
            </button>
          </div>

          {/* Allocation Information Note */}
          <div className="p-3 rounded-[8px] bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] text-[11px] text-[#757575] space-y-1">
            <div className="font-semibold text-[#111111]">Informasi Alokasi Dana:</div>
            <p>
              Tiap pembayaran syahriah akan dialokasikan tepat <strong>Rp 50.000</strong> ke tabungan santri, dan sisanya dialokasikan ke operasional pondok.
            </p>
          </div>

          {/* Transfer Date */}
          <div className="space-y-1.5">
            <Label htmlFor="tanggalBayar" className="text-xs font-semibold text-[#111111]">
              Tanggal Transfer <span className="text-[#e32d14]">*</span>
            </Label>
            <Input
              id="tanggalBayar"
              type="date"
              value={tanggalBayar}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setTanggalBayar(e.target.value)}
              className="border-[rgba(0,0,0,0.12)] rounded-[8px]"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="catatan" className="text-xs font-semibold text-[#111111]">
              Catatan Santri (Opsional)
            </Label>
            <Input
              id="catatan"
              type="text"
              placeholder="Contoh: Transfer via ATM BCA a.n. Bapak Ahmad Syahroni"
              value={catatanSantri}
              onChange={(e) => setCatatanSantri(e.target.value)}
              className="border-[rgba(0,0,0,0.12)] rounded-[8px]"
              maxLength={250}
            />
          </div>
        </CardContent>
      </Card>

      {/* Proof Uploader Card */}
      <Card className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">
            Unggah Foto Bukti Transfer <span className="text-[#e32d14]">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProofUploader
            onImageCompressed={(res) => setCompressedProof(res)}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* General Error Notice */}
      {errorMessage && (
        <div className="p-3 rounded-[8px] bg-[#fdeeed] border border-[rgba(227,45,20,0.2)] text-[#e32d14] text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || !compressedProof || nominal <= 0}
        className="w-full h-11 rounded-[8px] bg-[#0075de] hover:bg-[#0060b8] text-white font-medium text-sm shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Memproses Bukti Pembayaran...</span>
          </>
        ) : (
          <>
            <span>Kirim Konfirmasi Pembayaran</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
