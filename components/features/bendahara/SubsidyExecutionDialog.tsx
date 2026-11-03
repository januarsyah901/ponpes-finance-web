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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[12px] max-w-lg w-full shadow-none border border-[rgba(0,0,0,0.08)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0075de] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading">
              {result ? 'Subsidi Berhasil Diterapkan!' : 'Konfirmasi Eksekusi Penyaluran Subsidi'}
            </h3>
            <p className="text-xs text-[#e6f3fe]">
              {result ? 'Transaksi ACID berhasil dibukukan' : 'Tahap 2: Komitmen finansial ke database'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#e6f3fe] hover:text-white text-2xl leading-none"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {result ? (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#ebf5ee] text-[#2b6e4f] flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="text-center mb-4">
                <span className="text-xs font-mono uppercase tracking-widest text-[#757575] block mb-1">
                  Bukti Penyaluran Batch
                </span>
                <span className="text-sm font-mono font-bold px-3 py-1 bg-[#f6f5f4] text-[#111111] rounded-[8px]">
                  SUB-{ruleId.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[rgba(0,0,0,0.08)]">
                  <span className="text-[#757575]">Aturan Subsidi:</span>
                  <span className="font-semibold text-[#111111]">{result.ruleName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(0,0,0,0.08)]">
                  <span className="text-[#757575]">Total Santri Penerima:</span>
                  <span className="font-bold text-[#0075de] font-mono">{result.totalBeneficiaries} Santri</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[rgba(0,0,0,0.08)]">
                  <span className="text-[#757575]">Total Bantuan Disalurkan:</span>
                  <CurrencyDisplay amount={result.totalAppliedNominal} className="font-bold font-mono text-[#2b6e4f]" />
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#757575]">Waktu Eksekusi:</span>
                  <span className="font-mono text-[#757575]">{new Date(result.executionTimestamp).toLocaleString('id-ID')}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#757575] text-center">
                Tagihan masing-masing santri telah terpotong secara otomatis dan tercatat dalam buku besar.
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-[#0075de] hover:bg-[#0060b8] text-white font-medium rounded-[8px] text-sm transition shadow-none"
              >
                Tutup &amp; Perbarui Halaman
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-[#fff6e5] border border-[#b47800]/20 rounded-[8px] p-3 text-xs text-[#b47800] leading-relaxed">
                <span className="font-semibold">Perhatian Finansial:</span> Tindakan ini akan mengunci rekaman data santri, membukukan kredit subsidi ke tagihan tertunggak, dan memotong tabungan (jika sumber dana dari tabungan).
              </div>

              {/* Summary Card */}
              <div className="bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Aturan Subsidi</span>
                  <span className="font-bold text-[#111111]">{previewData?.ruleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Sumber Dana</span>
                  <span className="font-medium text-[#111111] capitalize">
                    {previewData?.sumberDana === 'potong_tabungan' ? 'Tabungan Santri' : 'Bantuan Langsung (Kas Pesantren)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Jumlah Santri Terpilih</span>
                  <span className="font-bold text-[#0075de] font-mono">{selectedSantriIds.length} Santri</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[rgba(0,0,0,0.08)]">
                  <span className="text-[#111111] font-semibold">Total Anggaran Penyaluran</span>
                  <CurrencyDisplay
                    amount={totalCalculatedBudget}
                    className="text-base font-bold font-mono text-[#2b6e4f]"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-[#fdeeed] border border-[#e32d14]/20 text-[#e32d14] text-xs rounded-[8px] p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-[#f6f5f4] hover:bg-[rgba(0,0,0,0.08)] text-[#111111] font-medium rounded-[8px] text-sm transition border border-[rgba(0,0,0,0.12)] shadow-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={loading || selectedSantriIds.length === 0}
                  className="flex-1 py-2.5 px-4 bg-[#0075de] hover:bg-[#0060b8] disabled:bg-[rgba(0,0,0,0.08)] text-white font-semibold rounded-[8px] text-sm transition flex items-center justify-center gap-2 shadow-none"
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
