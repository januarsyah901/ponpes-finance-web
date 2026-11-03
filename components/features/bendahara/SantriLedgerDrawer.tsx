'use client';

import React from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { formatTanggalIndo } from '@/lib/formatters';

interface SantriDetail {
  id: string;
  nis: string;
  nama: string;
  status: string;
  komplekKode?: string;
  kategoriNama?: string;
  saldoTabungan: number;
}

interface SantriLedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  santri: SantriDetail | null;
  mutations: any[];
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
}

export function SantriLedgerDrawer({
  isOpen,
  onClose,
  santri,
  mutations,
  onOpenDeposit,
  onOpenWithdraw,
}: SantriLedgerDrawerProps) {
  if (!isOpen || !santri) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-[#E8E8E8] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-[#202119] px-6 py-5 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-mono">
                  {santri.nis}
                </span>
                <span className="text-xs text-[#EAEAEA] font-medium">
                  {santri.komplekKode} • {santri.kategoriNama}
                </span>
              </div>
              <h2 className="text-lg font-bold font-sans text-white">{santri.nama}</h2>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xs text-[#EAEAEA]">Saldo Tabungan:</span>
                <CurrencyDisplay
                  amount={santri.saldoTabungan}
                  className="text-2xl font-bold font-mono text-white"
                />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#EAEAEA] hover:text-white text-2xl leading-none cursor-pointer"
              aria-label="Tutup"
            >
              &times;
            </button>
          </div>

          {/* Action Quick Buttons */}
          <div className="p-4 bg-[#F5F5F5] border-b border-[#E8E8E8] flex gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenDeposit?.();
              }}
              className="flex-1 py-2 px-3 bg-[#EAF7EF] hover:bg-[#d8f1e2] text-[#2B8A60] border border-[rgba(43,138,96,0.2)] font-medium text-xs rounded-[8px] transition flex items-center justify-center gap-1.5 shadow-none cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Setor / Saldo Awal
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenWithdraw?.();
              }}
              className="flex-1 py-2 px-3 bg-[#FCEDEF] hover:bg-[#fad5da] text-[#C84C5A] border border-[rgba(200,76,90,0.2)] font-medium text-xs rounded-[8px] transition flex items-center justify-center gap-1.5 shadow-none cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
              Tarik Tabungan
            </button>
          </div>

          {/* Mutations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <h4 className="text-xs font-semibold text-[#626262] uppercase tracking-wider mb-2">
              Buku Mutasi Transaksi ({mutations.length})
            </h4>

            {mutations.length === 0 ? (
              <div className="p-8 text-center text-[#626262] text-xs">
                Belum ada transaksi pada akun tabungan ini.
              </div>
            ) : (
              mutations.map((m) => {
                const isCredit = m.nominal > 0;
                return (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white border border-[#E8E8E8] rounded-[18px] hover:border-[#202119]/30 transition flex items-center justify-between shadow-none"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#202119]">
                          {m.jenisMutasi === 'setoran_syahriah' && 'Setoran Syahriah'}
                          {m.jenisMutasi === 'saldo_awal' && 'Saldo Awal'}
                          {m.jenisMutasi === 'pemakaian_kegiatan' && 'Pembayaran Kegiatan'}
                          {m.jenisMutasi === 'penarikan_mendesak' && 'Penarikan Mendesak'}
                          {m.jenisMutasi === 'penarikan_boyong' && 'Penarikan Boyong'}
                          {m.jenisMutasi === 'koreksi' && 'Koreksi'}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                            isCredit
                              ? 'bg-[#EAF7EF] text-[#2B8A60] border border-[rgba(43,138,96,0.2)]'
                              : 'bg-[#FCEDEF] text-[#C84C5A] border border-[rgba(200,76,90,0.2)]'
                          }`}
                        >
                          {isCredit ? 'KREDIT' : 'DEBIT'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#626262] mt-0.5 line-clamp-1">{m.keterangan}</p>
                      <span className="text-[10px] text-[#626262] mt-1 inline-block">
                        {formatTanggalIndo(new Date(m.createdAt))}
                      </span>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <CurrencyDisplay
                        amount={m.nominal}
                        showSign
                        className={`text-sm font-bold font-mono ${
                          isCredit ? 'text-[#2B8A60]' : 'text-[#C84C5A]'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#E8E8E8] bg-[#F5F5F5] text-right">
            <button
              onClick={onClose}
              className="py-2 px-4 bg-white border border-[#E8E8E8] hover:bg-[#F5F5F5] text-[#202119] text-xs font-medium rounded-[8px] shadow-none transition cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
