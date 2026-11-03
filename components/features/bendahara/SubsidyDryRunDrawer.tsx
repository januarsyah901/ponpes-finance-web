'use client';

import React, { useState, useEffect } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { previewSubsidyRuleAction } from '@/actions/subsidy.actions';

interface SubsidyDryRunDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId: string | null;
  onProceedToExecution: (ruleId: string, selectedSantriIds: string[], previewData: any) => void;
}

export function SubsidyDryRunDrawer({
  isOpen,
  onClose,
  ruleId,
  onProceedToExecution,
}: SubsidyDryRunDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'eligible' | 'ineligible'>('eligible');

  useEffect(() => {
    if (isOpen && ruleId) {
      loadPreview(ruleId);
    }
  }, [isOpen, ruleId]);

  const loadPreview = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await previewSubsidyRuleAction(id);
      if (!res.success || !res.data) {
        setError(res.error || 'Gagal memuat simulasi.');
      } else {
        setPreviewData(res.data);
        const allEligibleIds = (res.data.eligibleBeneficiaries || []).map((b: any) => b.santriId);
        setSelectedSantriIds(allEligibleIds);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !ruleId) return null;

  const eligibleList = previewData?.eligibleBeneficiaries || [];
  const ineligibleList = previewData?.ineligibleCandidates || [];

  const handleToggleAll = () => {
    if (selectedSantriIds.length === eligibleList.length) {
      setSelectedSantriIds([]);
    } else {
      setSelectedSantriIds(eligibleList.map((b: any) => b.santriId));
    }
  };

  const handleToggleSantri = (id: string) => {
    setSelectedSantriIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const totalCalculatedBudget = eligibleList
    .filter((b: any) => selectedSantriIds.includes(b.santriId))
    .reduce((acc: number, curr: any) => acc + (curr.proposedSubsidyNominal || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-3xl bg-white shadow-none flex flex-col">
          {/* Header */}
          <div className="bg-[#0075de] px-6 py-5 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#0060b8] font-semibold uppercase tracking-wider text-[#e6f3fe]">
                  Tahap 1: Simulasi Dry-Run
                </span>
                <span className="text-xs text-[#e6f3fe]">
                  (Tidak ada modifikasi database)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-heading">
                {previewData?.ruleName || 'Simulasi Kelayakan Aturan Subsidi'}
              </h2>
              <p className="text-xs text-[#e6f3fe]/90 mt-1">
                Evaluasi otomatis seluruh santri aktif terhadap kriteria aturan
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#e6f3fe] hover:text-white text-2xl leading-none"
              aria-label="Tutup"
            >
              &times;
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-[#0075de] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-[#757575]">Menghitung kelayakan santri &amp; anggaran...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 p-6">
              <div className="bg-[#fdeeed] border border-[#e32d14]/20 text-[#e32d14] p-4 rounded-[8px] text-sm">
                {error}
              </div>
            </div>
          ) : (
            <>
              {/* KPI Summary Banner */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-[#f6f5f4] border-b border-[rgba(0,0,0,0.08)]">
                <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3 shadow-none">
                  <span className="text-[11px] font-medium text-[#757575] block mb-0.5">Memenuhi Syarat</span>
                  <div className="text-xl font-bold text-[#0075de] font-mono">
                    {eligibleList.length} <span className="text-xs font-sans text-[#757575]">Santri</span>
                  </div>
                </div>

                <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3 shadow-none">
                  <span className="text-[11px] font-medium text-[#757575] block mb-0.5">Tidak Memenuhi</span>
                  <div className="text-xl font-bold text-[#757575] font-mono">
                    {ineligibleList.length} <span className="text-xs font-sans text-[#757575]">Santri</span>
                  </div>
                </div>

                <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3 shadow-none">
                  <span className="text-[11px] font-medium text-[#757575] block mb-0.5">Estimasi Anggaran Terpilih</span>
                  <CurrencyDisplay
                    amount={totalCalculatedBudget}
                    className="text-xl font-bold text-[#2b6e4f] font-mono"
                  />
                </div>
              </div>

              {/* Tabs: Eligible vs Ineligible */}
              <div className="px-6 pt-3 border-b border-[rgba(0,0,0,0.08)] flex gap-4">
                <button
                  onClick={() => setActiveTab('eligible')}
                  className={`pb-2 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'eligible'
                      ? 'border-[#0075de] text-[#0075de]'
                      : 'border-transparent text-[#757575] hover:text-[#111111]'
                  }`}
                >
                  Santri Penerima Bantuan ({eligibleList.length})
                </button>
                <button
                  onClick={() => setActiveTab('ineligible')}
                  className={`pb-2 text-xs font-semibold border-b-2 transition ${
                    activeTab === 'ineligible'
                      ? 'border-[#0075de] text-[#0075de]'
                      : 'border-transparent text-[#757575] hover:text-[#111111]'
                  }`}
                >
                  Santri Tidak Lolos ({ineligibleList.length})
                </button>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'eligible' ? (
                  eligibleList.length === 0 ? (
                    <div className="py-12 text-center text-[#757575] text-xs">
                      Tidak ada santri yang memenuhi seluruh kriteria aturan ini.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.08)] px-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#757575]">
                          <input
                            type="checkbox"
                            checked={selectedSantriIds.length === eligibleList.length && eligibleList.length > 0}
                            onChange={handleToggleAll}
                            className="w-4 h-4 accent-[#0075de] rounded"
                          />
                          Pilih Semua ({selectedSantriIds.length}/{eligibleList.length})
                        </label>
                        <span className="text-[11px] text-[#757575]">
                          Hapus centang untuk mengecualikan santri
                        </span>
                      </div>

                      <div className="divide-y divide-[rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.08)] rounded-[12px] overflow-hidden">
                        {eligibleList.map((item: any) => {
                          const isChecked = selectedSantriIds.includes(item.santriId);
                          return (
                            <div
                              key={item.santriId}
                              onClick={() => handleToggleSantri(item.santriId)}
                              className={`p-3.5 flex items-center justify-between cursor-pointer transition ${
                                isChecked ? 'bg-white hover:bg-[#e6f3fe]/40' : 'bg-[#f6f5f4]/60 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleSantri(item.santriId)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-4 h-4 accent-[#0075de] rounded"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#111111]">{item.nama}</span>
                                    <span className="text-[10px] font-mono text-[#757575]">NIS: {item.nis}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f6f5f4] text-[#757575]">
                                      {item.komplekKode} • {item.kategoriKode}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#757575] mt-0.5">
                                    Target: <span className="font-medium text-[#111111]">{item.targetBillJudul}</span> • Saldo Tabungan: Rp{item.saldoTabungan.toLocaleString('id-ID')}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <CurrencyDisplay
                                  amount={item.proposedSubsidyNominal}
                                  className="text-sm font-bold font-mono text-[#2b6e4f]"
                                />
                                <span className="block text-[10px] text-[#757575]">
                                  Sisa hutang: Rp{item.remainingBillAfterSubsidy.toLocaleString('id-ID')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  ineligibleList.length === 0 ? (
                    <div className="py-12 text-center text-[#757575] text-xs">
                      Semua santri yang dievaluasi lolos kriteria.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ineligibleList.map((item: any) => (
                        <div
                          key={item.santriId}
                          className="p-3 bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] rounded-[12px] text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-[#111111]">
                              {item.nama} ({item.nis})
                            </span>
                            <span className="text-[10px] text-[#757575]">
                              {item.komplekKode} • {item.kategoriKode}
                            </span>
                          </div>
                          <ul className="list-disc list-inside text-[#e32d14] text-[11px] space-y-0.5">
                            {item.reasons.map((r: string, idx: number) => (
                              <li key={idx}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[rgba(0,0,0,0.08)] bg-[#f6f5f4] flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 bg-white hover:bg-[#f6f5f4] text-[#111111] text-xs font-semibold rounded-[8px] transition border border-[rgba(0,0,0,0.12)] shadow-none"
                >
                  Tutup Simulasi
                </button>

                <button
                  type="button"
                  disabled={selectedSantriIds.length === 0}
                  onClick={() => onProceedToExecution(ruleId, selectedSantriIds, previewData)}
                  className="py-2.5 px-5 bg-[#0075de] hover:bg-[#0060b8] disabled:bg-[rgba(0,0,0,0.08)] text-white text-xs sm:text-sm font-semibold rounded-[8px] shadow-none transition flex items-center gap-2"
                >
                  <span>Lanjutkan ke Eksekusi ({selectedSantriIds.length} Santri)</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
