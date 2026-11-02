'use client';

import React, { useState, useMemo } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { EmergencyWithdrawalModal } from './EmergencyWithdrawalModal';
import { formatTanggalIndo } from '@/lib/formatters';

interface Profile {
  id: string;
  nis: string;
  nama: string;
  status: string;
  komplekNama?: string;
  kategoriNama?: string;
  nomorWhatsapp?: string | null;
  nomorWhatsappWali?: string | null;
}

interface MutationItem {
  id: string;
  jenisMutasi: string;
  nominal: number;
  referensiTipe: string | null;
  referensiId: string | null;
  keterangan: string;
  createdAt: string | Date;
}

interface Breakdown {
  setoranSyahriah: number;
  saldoAwal: number;
  pemakaianKegiatan: number;
  penarikanMendesak: number;
  penarikanBoyong: number;
  koreksi: number;
}

interface SantriSavingsViewClientProps {
  profile: Profile | null;
  balance: number;
  breakdown: Breakdown;
  initialMutations: MutationItem[];
}

export function SantriSavingsViewClient({
  profile,
  balance,
  breakdown,
  initialMutations,
}: SantriSavingsViewClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('semua');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter mutations based on selected tab
  const filteredMutations = useMemo(() => {
    if (selectedFilter === 'semua') return initialMutations;
    return initialMutations.filter((m) => m.jenisMutasi === selectedFilter);
  }, [initialMutations, selectedFilter]);

  const totalPenggunaan = Math.abs(
    (breakdown.pemakaianKegiatan || 0) +
    (breakdown.penarikanMendesak || 0) +
    (breakdown.penarikanBoyong || 0)
  );

  return (
    <div className="space-y-6">
      {/* Hero Balance Card */}
      <div className="bg-gradient-to-br from-[#0F5132] via-[#11633d] to-[#10B981] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute right-20 -bottom-16 w-40 h-40 rounded-full bg-emerald-400/20 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium text-emerald-100 backdrop-blur-sm">
                Buku Tabungan Digital
              </span>
              {profile && (
                <span className="text-xs text-emerald-100/80 font-mono">
                  NIS: {profile.nis}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mb-1">
              Total Saldo Tabungan Anda
            </p>
            <div className="flex items-baseline gap-2">
              <CurrencyDisplay
                amount={balance}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-mono text-white tracking-tight"
              />
            </div>
            <p className="text-xs text-emerald-200 mt-2">
              Akumulasi otomatis Rp50.000 dari setiap pelunasan Syahriah & setoran awal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="py-3 px-5 bg-white hover:bg-slate-50 text-[#0F5132] font-semibold text-sm rounded-2xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ajukan Penarikan Mendesak
            </button>
          </div>
        </div>
      </div>

      {/* Source Breakdown Chips / Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alokasi Syahriah */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-emerald-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Alokasi Syahriah</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <CurrencyDisplay
            amount={breakdown.setoranSyahriah || 0}
            className="text-lg font-bold font-mono text-emerald-700"
          />
          <p className="text-[11px] text-slate-400 mt-1">Rp50.000 / bulan lunas</p>
        </div>

        {/* Card 2: Saldo Awal / Mandiri */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Saldo Awal / Setoran</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <CurrencyDisplay
            amount={breakdown.saldoAwal || 0}
            className="text-lg font-bold font-mono text-blue-700"
          />
          <p className="text-[11px] text-slate-400 mt-1">Migrasi & setoran mandiri</p>
        </div>

        {/* Card 3: Total Penggunaan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-red-300 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">Total Penggunaan</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </div>
          </div>
          <CurrencyDisplay
            amount={totalPenggunaan}
            className="text-lg font-bold font-mono text-red-700"
          />
          <p className="text-[11px] text-slate-400 mt-1">Tagihan kegiatan / penarikan</p>
        </div>
      </div>

      {/* Mutation History Section */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base font-heading">Riwayat Mutasi Tabungan</h3>
            <p className="text-xs text-slate-500">Transparansi arus kas tabungan santri secara kronologis</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'semua', label: 'Semua' },
              { id: 'setoran_syahriah', label: 'Syahriah' },
              { id: 'saldo_awal', label: 'Saldo Awal' },
              { id: 'pemakaian_kegiatan', label: 'Kegiatan' },
              { id: 'penarikan_mendesak', label: 'Mendesak' },
              { id: 'koreksi', label: 'Koreksi' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedFilter === f.id
                    ? 'bg-[#0F5132] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mutation Items List */}
        {filteredMutations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Belum ada riwayat mutasi tabungan</p>
            <p className="text-xs text-slate-400 mt-1">Setiap pembayaran syahriah akan mengalokasikan tabungan ke sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMutations.map((m) => {
              const isCredit = m.nominal > 0;
              const dateObj = new Date(m.createdAt);
              const formattedDate = formatTanggalIndo(dateObj);

              return (
                <div key={m.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-start gap-3.5">
                    {/* Badge Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {isCredit ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {m.jenisMutasi === 'setoran_syahriah' && 'Setoran Syahriah'}
                          {m.jenisMutasi === 'saldo_awal' && 'Saldo Awal'}
                          {m.jenisMutasi === 'pemakaian_kegiatan' && 'Pembayaran Kegiatan'}
                          {m.jenisMutasi === 'penarikan_mendesak' && 'Penarikan Mendesak'}
                          {m.jenisMutasi === 'penarikan_boyong' && 'Penarikan Boyong'}
                          {m.jenisMutasi === 'koreksi' && 'Koreksi Saldo'}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isCredit
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {isCredit ? 'KREDIT' : 'DEBIT'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{m.keterangan}</p>
                      <span className="text-[11px] text-slate-400 mt-1 inline-block">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="text-right pl-3 shrink-0">
                    <CurrencyDisplay
                      amount={m.nominal}
                      showSign
                      className={`text-base font-bold font-mono ${
                        isCredit ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Emergency Withdrawal Modal */}
      <EmergencyWithdrawalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentBalance={balance}
        santriNomorWhatsapp={profile?.nomorWhatsapp || profile?.nomorWhatsappWali}
      />
    </div>
  );
}
