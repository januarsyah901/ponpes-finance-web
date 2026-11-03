'use client';

import React, { useState } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { executeSubsidyRuleAction } from '@/actions/subsidy.actions';

interface SubsidyExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: string | null;
  selectedSantriIds: string[];
  previewData: any;
  onSuccess?: () => void;
}

export function SubsidyExecutionDialog({
  isOpen,
  onClose,
  ruleId,
  selectedSantriIds,
  previewData,
  onSuccess,
}: SubsidyExecutionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  if (!isOpen || !ruleId) return null;

  const totalCalculatedBudget = (previewData?.eligibleBeneficiaries || [])
    .filter((b: any) => selectedSantriIds.includes(b.santriId))
    .reduce((acc: number, curr: any) => acc + (curr.proposedSubsidyNominal || 0), 0);

  const handleExecute = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await executeSubsidyRuleAction({
        ruleId,
        selectedSantriIds,
      });

      if (!res.success) {
        setError(res.error || 'Gagal mengeksekusi penyaluran subsidi.');
      } else {
        setResult(res.data);
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202119]/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[18px] max-w-lg w-full shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#E8E8E8] overflow-hidden">
        {/* Header */}
        <div className="bg-[#202119] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading">
              {result ? 'Subsidi Berhasil Diterapkan!' : 'Konfirmasi Eksekusi Penyaluran Subsidi'}
            </h3>
            <p className="text-xs text-[#EAEAEA]">
              {result ? 'Transaksi ACID berhasil dibukukan' : 'Tahap 2: Komitmen finansial ke database'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#EAEAEA] hover:text-white text-2xl leading-none"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#EAF7EF] text-[#2B8A60] flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="text-center mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-[#626262] block mb-1">
                  Bukti Penyaluran Batch
                </span>
                <span className="text-sm font-mono font-bold px-3 py-1 bg-[#F5F5F5] text-[#202119] border border-[#E8E8E8] rounded-[8px]">
                  SUB-{ruleId.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="bg-[#F6F6F6] border border-[#E8E8E8] rounded-[18px] p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E8E8E8]">
                  <span className="text-[#626262]">Aturan Subsidi:</span>
                  <span className="font-semibold text-[#202119]">{result.ruleName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8E8E8]">
                  <span className="text-[#626262]">Total Santri Penerima:</span>
                  <span className="font-bold text-[#202119] font-sans tabular-nums lining-nums">{result.totalBeneficiaries} Santri</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E8E8E8]">
                  <span className="text-[#626262]">Total Bantuan Disalurkan:</span>
                  <CurrencyDisplay amount={result.totalAppliedNominal} className="font-bold font-sans tabular-nums lining-nums text-[#2B8A60]" />
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#626262]">Waktu Eksekusi:</span>
                  <span className="font-sans text-[#626262]">{new Date(result.executionTimestamp).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#626262] text-center">
                Tagihan masing-masing santri telah terpotong secara otomatis dan tercatat dalam buku besar.
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-[#202119] hover:bg-[#2e2f26] text-white font-medium rounded-[8px] text-sm transition shadow-none"
              >
                Tutup &amp; Perbarui Halaman
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#FFF7ED] border border-[rgba(194,65,12,0.2)] rounded-[8px] p-3 text-xs text-[#C2410C] leading-relaxed">
                <span className="font-semibold">Perhatian Finansial:</span> Tindakan ini akan mengunci rekaman data santri, membukukan kredit subsidi ke tagihan tertunggak, dan memotong tabungan (jika sumber dana dari tabungan).
              </div>

              {/* Summary Card */}
              <div className="bg-[#F6F6F6] border border-[#E8E8E8] rounded-[18px] p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#626262]">Aturan Subsidi</span>
                  <span className="font-bold text-[#202119]">{previewData?.ruleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#626262]">Sumber Dana</span>
                  <span className="font-medium text-[#202119] capitalize">
                    {previewData?.sumberDana === 'potong_tabungan' ? 'Tabungan Santri' : 'Bantuan Langsung (Kas Pesantren)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#626262]">Jumlah Santri Terpilih</span>
                  <span className="font-bold text-[#202119] font-sans tabular-nums lining-nums">{selectedSantriIds.length} Santri</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E8E8E8]">
                  <span className="text-[#202119] font-semibold">Total Anggaran Penyaluran</span>
                  <CurrencyDisplay
                    amount={totalCalculatedBudget}
                    className="text-base font-bold font-sans tabular-nums lining-nums text-[#2B8A60]"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-[#FCEDEF] border border-[rgba(200,76,90,0.2)] text-[#C84C5A] text-xs rounded-[8px] p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#202119] font-medium rounded-[8px] text-sm transition border border-[#E8E8E8] shadow-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={loading || selectedSantriIds.length === 0}
                  className="flex-1 py-2.5 px-4 bg-[#202119] hover:bg-[#2e2f26] disabled:bg-[#F5F5F5] disabled:text-[#747474] text-white font-semibold rounded-[8px] text-sm transition flex items-center justify-center gap-2 shadow-none"
                >
                  {loading ? (
                    <span>Mengeksekusi...</span>
                  ) : (
                    <span>Konfirmasi &amp; Eksekusi Sekarang</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
