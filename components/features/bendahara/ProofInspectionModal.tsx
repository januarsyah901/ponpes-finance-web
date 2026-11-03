'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatRupiah, formatDateIndo } from '@/lib/formatters';
import { verifyPaymentAction, rejectPaymentAction } from '@/actions/payment.actions';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCcw,
  AlertCircle,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationModalProps {
  payment: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPaymentId: string, actionType: 'verified' | 'rejected') => void;
}

export function ProofInspectionModal({
  payment,
  isOpen,
  onClose,
  onSuccess,
}: VerificationModalProps) {
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Decision Pathway State
  const [pathway, setPathway] = useState<'approve' | 'approve_corrected' | 'reject'>('approve');
  const [correctedNominal, setCorrectedNominal] = useState<string>('');
  const [alasanKoreksi, setAlasanKoreksi] = useState<string>('');
  const [alasanPenolakan, setAlasanPenolakan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!payment) return null;

  // Zoom controls
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 3.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setScale(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Common Rejection Presets
  const REJECTION_PRESETS = [
    'Bukti transfer buram / tidak terbaca',
    'Nomor rekening tujuan bukan rekening resmi pondok',
    'Nama pengirim dan mutasi bank tidak cocok',
    'Bukti transfer ganda / sudah pernah diverifikasi',
    'Nominal transfer tidak sesuai dengan mutasi bank',
  ];

  // Execution: Pathway 1 (Approve)
  const handleApproveStandard = async () => {
    setActionError(null);
    setIsSubmitting(true);

    try {
      const res = await verifyPaymentAction({
        pembayaranId: payment.id,
      });

      if (!res.success) throw new Error(res.error || 'Gagal memverifikasi pembayaran');
      onSuccess(payment.id, 'verified');
      onClose();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execution: Pathway 2 (Approve with Corrected Amount)
  const handleApproveCorrected = async () => {
    setActionError(null);
    const num = parseInt(correctedNominal.replace(/\D/g, ''), 10);

    if (!num || num <= 0) {
      setActionError('Nominal hasil koreksi harus lebih dari Rp 0');
      return;
    }

    if (!alasanKoreksi.trim() || alasanKoreksi.trim().length < 5) {
      setActionError('Alasan penyesuaian nominal wajib diisi (minimal 5 karakter)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyPaymentAction({
        pembayaranId: payment.id,
        nominalDiverifikasi: num,
        alasanKoreksi: alasanKoreksi.trim(),
      });

      if (!res.success) throw new Error(res.error || 'Gagal memverifikasi pembayaran dengan koreksi');
      onSuccess(payment.id, 'verified');
      onClose();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execution: Pathway 3 (Reject)
  const handleReject = async () => {
    setActionError(null);

    if (!alasanPenolakan || alasanPenolakan.trim().length < 5) {
      setActionError('Alasan penolakan wajib diisi minimal 5 karakter');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await rejectPaymentAction({
        pembayaranId: payment.id,
        alasanPenolakan: alasanPenolakan.trim(),
      });

      if (!res.success) throw new Error(res.error || 'Gagal menolak pembayaran');
      onSuccess(payment.id, 'rejected');
      onClose();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col sm:rounded-[12px]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[rgba(0,0,0,0.08)] shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="text-base font-bold font-heading text-[#111111]">
                Pemeriksaan &amp; Verifikasi Bukti Transfer
              </DialogTitle>
              <p className="text-xs text-[#757575]">
                ID Pembayaran: <span className="font-mono">{payment.id.slice(0, 8)}...</span> • Tanggal: {formatDateIndo(payment.tanggalBayar)}
              </p>
            </div>
            <StatusBadge status={payment.status} />
          </div>
        </DialogHeader>

        {/* Body: Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Column: Proof Image Inspector (Canvas/Pan/Zoom) */}
          <div className="lg:col-span-7 bg-[#111111] relative flex flex-col overflow-hidden select-none">
            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-[rgba(0,0,0,0.7)] backdrop-blur-md p-1.5 rounded-[8px] border border-[rgba(255,255,255,0.1)] text-white">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
                title="Perbesar (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
                title="Perkecil (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
                title="Putar 90°"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded-[6px] hover:bg-[rgba(255,255,255,0.1)] transition-colors cursor-pointer"
                title="Reset Ukuran"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-mono px-2 text-[rgba(255,255,255,0.6)]">
                {Math.round(scale * 100)}%
              </span>
            </div>

            {/* Draggable Viewport */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={cn(
                'flex-1 flex items-center justify-center p-4 overflow-hidden',
                isPanning ? 'cursor-grabbing' : 'cursor-grab'
              )}
            >
              {payment.buktiUrl ? (
                <img
                  src={payment.buktiUrl}
                  alt="Bukti Transfer"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotation}deg)`,
                    transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                  }}
                  className="max-h-[75vh] max-w-[90%] object-contain rounded-[8px] shadow-2xl pointer-events-none"
                />
              ) : (
                <div className="text-[rgba(255,255,255,0.4)] text-xs text-center">
                  Bukti transfer tidak tersedia
                </div>
              )}
            </div>

            <div className="p-2 bg-[rgba(0,0,0,0.8)] text-[11px] text-[rgba(255,255,255,0.4)] text-center border-t border-[rgba(255,255,255,0.08)]">
              Gunakan klik dan seret mouse untuk menggeser gambar saat diperbesar
            </div>
          </div>

          {/* Right Column: Verification Workbench */}
          <div className="lg:col-span-5 bg-white flex flex-col h-full overflow-y-auto p-6 space-y-5 border-l border-[rgba(0,0,0,0.08)]">
            {/* Santri Card */}
            <div className="p-4 rounded-[12px] bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0075de]">
                <User className="h-4 w-4" />
                <span>Identitas Santri</span>
              </div>
              <div className="text-sm font-bold text-[#111111]">{payment.santriNama}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#757575]">
                <div>
                  <span>NIS: </span>
                  <span className="font-mono text-[#111111]">{payment.santriNis}</span>
                </div>
                <div>
                  <span>Komplek: </span>
                  <span className="font-semibold text-[#111111]">{payment.komplekNama}</span>
                </div>
                <div>
                  <span>Kategori: </span>
                  <span className="text-[#111111]">{payment.kategoriNama}</span>
                </div>
              </div>
            </div>

            {/* Transfer Details Card */}
            <div className="p-4 rounded-[12px] bg-white border border-[rgba(0,0,0,0.08)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#757575]">Nominal Diajukan Santri:</span>
                <CurrencyDisplay amount={payment.nominal} className="text-lg font-bold text-[#0075de]" />
              </div>
              {payment.catatanSantri && (
                <div className="pt-2 border-t border-[rgba(0,0,0,0.08)] text-xs">
                  <span className="text-[#757575]">Catatan: </span>
                  <span className="text-[#111111] italic">&ldquo;{payment.catatanSantri}&rdquo;</span>
                </div>
              )}
            </div>

            {/* Action Error Notice */}
            {actionError && (
              <div className="p-3 rounded-[8px] bg-[#fdeeed] border border-[rgba(227,45,20,0.2)] text-[#e32d14] text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Pathway Selector */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">
                Pilih Keputusan Verifikasi
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f6f5f4] rounded-[12px]">
                <button
                  type="button"
                  onClick={() => setPathway('approve')}
                  className={cn(
                    'py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer',
                    pathway === 'approve'
                      ? 'bg-white text-[#0075de] shadow-sm'
                      : 'text-[#757575] hover:text-[#111111]'
                  )}
                >
                  Setujui
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPathway('approve_corrected');
                    setCorrectedNominal(payment.nominal.toLocaleString('id-ID'));
                  }}
                  className={cn(
                    'py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer',
                    pathway === 'approve_corrected'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-[#757575] hover:text-[#111111]'
                  )}
                >
                  Koreksi
                </button>
                <button
                  type="button"
                  onClick={() => setPathway('reject')}
                  className={cn(
                    'py-2 rounded-[8px] text-xs font-semibold transition-all cursor-pointer',
                    pathway === 'reject'
                      ? 'bg-white text-[#e32d14] shadow-sm'
                      : 'text-[#757575] hover:text-[#111111]'
                  )}
                >
                  Tolak
                </button>
              </div>

              {/* Pathway 1: Standard Approval */}
              {pathway === 'approve' && (
                <div className="space-y-3 p-4 rounded-[12px] border border-[rgba(0,117,222,0.2)] bg-[#e6f3fe]">
                  <div className="text-xs text-[#111111]">
                    Menyetujui pembayaran sebesar <CurrencyDisplay amount={payment.nominal} className="font-bold text-[#0075de]" /> sesuai bukti transfer.
                  </div>

                  <div className="text-[11px] text-[#0075de] bg-white p-2.5 rounded-[8px] border border-[rgba(0,117,222,0.2)] space-y-1">
                    <div className="font-semibold">Simulasi Alokasi Otomatis:</div>
                    <div className="flex justify-between">
                      <span>Alokasi Tabungan Santri:</span>
                      <span className="font-mono font-medium">Rp 50.000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Alokasi Operasional Komplek:</span>
                      <span className="font-mono font-medium">
                        {formatRupiah(Math.max(payment.nominal - 50000, 0))}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={handleApproveStandard}
                    disabled={isSubmitting}
                    className="w-full bg-[#0075de] hover:bg-[#0060b8] text-white font-semibold text-xs h-10 shadow-none cursor-pointer rounded-[8px]"
                  >
                    {isSubmitting ? 'Memproses Alokasi...' : `Konfirmasi & Setujui (${formatRupiah(payment.nominal)})`}
                  </Button>
                </div>
              )}

              {/* Pathway 2: Approve with Corrected Amount */}
              {pathway === 'approve_corrected' && (
                <div className="space-y-3 p-4 rounded-[12px] border border-amber-200 bg-amber-50/50">
                  <div className="text-xs text-amber-900">
                    Ubah nominal jika terdapat salah ketik oleh santri sesuai mutasi bank yang valid.
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-amber-900">
                      Nominal Sebenarnya (Rp) <span className="text-[#e32d14]">*</span>
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={correctedNominal}
                      onChange={(e) => {
                        const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                        setCorrectedNominal(num > 0 ? num.toLocaleString('id-ID') : '');
                      }}
                      className="font-mono font-bold bg-white border border-[rgba(0,0,0,0.12)] rounded-[8px] focus:ring-1 focus:ring-[#0075de] shadow-none"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-amber-900">
                      Alasan Koreksi <span className="text-[#e32d14]">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={alasanKoreksi}
                      onChange={(e) => setAlasanKoreksi(e.target.value)}
                      placeholder="Contoh: Bukti transfer tertera Rp300.000 bukan Rp350.000"
                      className="text-xs bg-white border border-[rgba(0,0,0,0.12)] rounded-[8px] focus:ring-1 focus:ring-[#0075de] shadow-none"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleApproveCorrected}
                    disabled={isSubmitting || !correctedNominal || !alasanKoreksi.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-10 shadow-none cursor-pointer rounded-[8px]"
                  >
                    {isSubmitting ? 'Menyimpan Koreksi...' : 'Setujui dengan Koreksi Nominal'}
                  </Button>
                </div>
              )}

              {/* Pathway 3: Reject */}
              {pathway === 'reject' && (
                <div className="space-y-3 p-4 rounded-[12px] border border-[rgba(227,45,20,0.2)] bg-[#fdeeed]">
                  <div className="text-xs text-[#e32d14]">
                    Tolak bukti transfer yang tidak valid. Santri akan menerima pemberitahuan beserta alasannya.
                  </div>

                  {/* Quick Reason Badges */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#e32d14]">Alasan Cepat:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {REJECTION_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAlasanPenolakan(preset)}
                          className="px-2 py-1 rounded-[6px] text-[10px] bg-white border border-[rgba(227,45,20,0.2)] text-[#e32d14] hover:bg-[#fdeeed] transition-colors cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-[#e32d14]">
                      Alasan Penolakan (Wajib) <span className="text-[#e32d14]">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={alasanPenolakan}
                      onChange={(e) => setAlasanPenolakan(e.target.value)}
                      placeholder="Tuliskan alasan penolakan secara jelas..."
                      className="text-xs bg-white border border-[rgba(0,0,0,0.12)] rounded-[8px] focus:ring-1 focus:ring-[#0075de] shadow-none"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleReject}
                    disabled={isSubmitting || alasanPenolakan.trim().length < 5}
                    className="w-full bg-[#f64932] hover:bg-[#e32d14] text-white font-semibold text-xs h-10 shadow-none cursor-pointer rounded-[8px]"
                  >
                    {isSubmitting ? 'Menolak...' : 'Tolak Pembayaran'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
