'use client';

import React, { useState } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { SubsidyRuleBuilderModal } from './SubsidyRuleBuilderModal';
import { SubsidyDryRunDrawer } from './SubsidyDryRunDrawer';
import { SubsidyExecutionDialog } from './SubsidyExecutionDialog';
import { formatTanggalIndo } from '@/lib/formatters';
import { useRouter } from 'next/navigation';

interface ComplexItem {
  id: string;
  kode: string;
  nama: string;
}

interface EventBillOption {
  id: string;
  judul: string;
  tipe: string;
  nominal: number;
}

interface SubsidyRuleItem {
  id: string;
  nama: string;
  nominal: number;
  syaratJson: any;
  isActive: boolean;
  tagihanKegiatanId?: string | null;
  createdAt: string | Date;
}

interface PastExecutionItem {
  id: string;
  aturanSubsidiId: string;
  aturanNama: string;
  santriId: string;
  santriNis: string;
  santriNama: string;
  nominalDiterima: number;
  diterapkanPada: string | Date;
}

interface BendaharaSubsidyClientProps {
  complexList: ComplexItem[];
  initialRules: SubsidyRuleItem[];
  eventBillsList: EventBillOption[];
  pastExecutions: PastExecutionItem[];
}

export function BendaharaSubsidyClient({
  complexList,
  initialRules,
  eventBillsList,
  pastExecutions,
}: BendaharaSubsidyClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

  // Modals state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isDryRunOpen, setIsDryRunOpen] = useState(false);
  const [isExecutionOpen, setIsExecutionOpen] = useState(false);

  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);
  const [selectedSantriIds, setSelectedSantriIds] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleOpenSimulate = (ruleId: string) => {
    setActiveRuleId(ruleId);
    setIsDryRunOpen(true);
  };

  const handleProceedToExecution = (
    ruleId: string,
    santriIds: string[],
    data: any
  ) => {
    setActiveRuleId(ruleId);
    setSelectedSantriIds(santriIds);
    setPreviewData(data);
    setIsDryRunOpen(false);
    setIsExecutionOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#111111] tracking-tight">
            Mesin Otomasi Subsidi &amp; Keringanan
          </h1>
          <p className="text-sm text-[#757575]">
            Penetapan aturan multi-kriteria kelayakan dan penyaluran bantuan berbasis alokasi transaksi ACID
          </p>
        </div>

        <button
          onClick={() => setIsBuilderOpen(true)}
          className="py-2.5 px-4 bg-[#0075de] hover:bg-[#0060b8] text-white text-xs sm:text-sm font-semibold rounded-[8px] shadow-none transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Buat Aturan Subsidi Baru
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-[rgba(0,0,0,0.08)]">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'rules'
              ? 'border-[#0075de] text-[#0075de]'
              : 'border-transparent text-[#757575] hover:text-[#111111]'
          }`}
        >
          Daftar Aturan Subsidi ({initialRules.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'history'
              ? 'border-[#0075de] text-[#0075de]'
              : 'border-transparent text-[#757575] hover:text-[#111111]'
          }`}
        >
          Riwayat Penyaluran ({pastExecutions.length})
        </button>
      </div>

      {/* Tab 1: Rules Grid */}
      {activeTab === 'rules' ? (
        initialRules.length === 0 ? (
          <div className="p-12 text-center bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] text-[#757575]">
            <div className="w-12 h-12 rounded-full bg-[#f6f5f4] flex items-center justify-center mx-auto mb-3 text-[#757575]">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#111111]">Belum ada aturan subsidi yang dibuat</p>
            <p className="text-xs text-[#757575] mt-1">
              Klik tombol &ldquo;Buat Aturan Subsidi Baru&rdquo; untuk merumuskan kriteria bantuan.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialRules.map((rule) => {
              const syarat = rule.syaratJson || {};
              return (
                <div
                  key={rule.id}
                  className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none hover:border-[rgba(0,0,0,0.16)] transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-[#111111] text-base font-heading">
                        {rule.nama}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                          rule.isActive
                            ? 'bg-[#ebf5ee] text-[#2b6e4f] border border-[#2b6e4f]/20'
                            : 'bg-[#f6f5f4] text-[#757575]'
                        }`}
                      >
                        {rule.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xs text-[#757575] font-medium">Bantuan per Santri:</span>
                      <CurrencyDisplay
                        amount={rule.nominal}
                        className="text-lg font-bold font-mono text-[#0075de]"
                      />
                    </div>

                    {/* Criteria Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {syarat.sumberDana && (
                        <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#e6f3fe] text-[#0075de] font-medium">
                          Sumber: {syarat.sumberDana === 'potong_tabungan' ? 'Tabungan Santri' : 'Bantuan Langsung'}
                        </span>
                      )}

                      {syarat.minTagihanTertunggak !== undefined && (
                        <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#fff6e5] text-[#b47800] font-medium">
                          Tunggakan &ge; {syarat.minTagihanTertunggak} tagihan
                        </span>
                      )}

                      {syarat.maxSaldoTabungan !== undefined && (
                        <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#ebf5ee] text-[#2b6e4f] font-medium">
                          Saldo &le; Rp{Number(syarat.maxSaldoTabungan).toLocaleString('id-ID')}
                        </span>
                      )}

                      {syarat.minLamaMondokBulan !== undefined && (
                        <span className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-medium">
                          Lama mondok &ge; {syarat.minLamaMondokBulan} bln
                        </span>
                      )}

                      {syarat.komplekIds?.length > 0 && (
                        <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#f6f5f4] text-[#111111] font-medium">
                          {syarat.komplekIds.length} Komplek Sasaran
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(0,0,0,0.08)] flex items-center justify-between">
                    <span className="text-[11px] text-[#757575] font-mono">
                      {formatTanggalIndo(new Date(rule.createdAt))}
                    </span>

                    <button
                      onClick={() => handleOpenSimulate(rule.id)}
                      className="py-2 px-4 bg-[#0075de] hover:bg-[#0060b8] text-white text-xs font-semibold rounded-[8px] shadow-none transition flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Simulasikan &amp; Jalankan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Tab 2: Execution History */
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] overflow-hidden shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#f6f5f4] border-b border-[rgba(0,0,0,0.08)] text-[rgba(0,0,0,0.6)] font-medium text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu Penyaluran</th>
                  <th className="py-3 px-4">Nama Aturan</th>
                  <th className="py-3 px-4">Santri Penerima</th>
                  <th className="py-3 px-4 text-right">Nominal Bantuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
                {pastExecutions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-[#757575]">
                      Belum ada riwayat subsidi yang dieksekusi.
                    </td>
                  </tr>
                ) : (
                  pastExecutions.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f6f5f4] transition">
                      <td className="py-3.5 px-4 font-mono text-[#757575]">
                        {formatTanggalIndo(new Date(item.diterapkanPada))}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#111111]">
                        {item.aturanNama}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#111111]">{item.santriNama}</div>
                        <div className="text-[11px] text-[#757575] font-mono">NIS: {item.santriNis}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#2b6e4f]">
                        <CurrencyDisplay amount={item.nominalDiterima} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rule Builder Modal */}
      <SubsidyRuleBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        complexList={complexList}
        eventBillsList={eventBillsList}
        onSuccess={handleRefresh}
      />

      {/* Dry-Run Drawer */}
      <SubsidyDryRunDrawer
        isOpen={isDryRunOpen}
        onClose={() => setIsDryRunOpen(false)}
        ruleId={activeRuleId}
        onProceedToExecution={handleProceedToExecution}
      />

      {/* Execution Confirmation Dialog */}
      <SubsidyExecutionDialog
        isOpen={isExecutionOpen}
        onClose={() => setIsExecutionOpen(false)}
        ruleId={activeRuleId}
        selectedSantriIds={selectedSantriIds}
        previewData={previewData}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

// Export SubsidyEngineClient as alias for compatibility
export const SubsidyEngineClient = BendaharaSubsidyClient;
