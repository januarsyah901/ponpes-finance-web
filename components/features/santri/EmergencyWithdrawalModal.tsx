'use client';

import React, { useState } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { requestEmergencyWithdrawalAction } from '@/actions/savings.actions';

interface EmergencyWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  santriNomorWhatsapp?: string | null;
}

export function EmergencyWithdrawalModal({
  isOpen,
  onClose,
  currentBalance,
  santriNomorWhatsapp,
}: EmergencyWithdrawalModalProps) {
  const [nominal, setNominal] = useState<number | ''>('');
  const [alasan, setAlasan] = useState('');
  const [nomorKontak, setNomorKontak] = useState(santriNomorWhatsapp || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const numNominal = Number(nominal) || 0;
  const isOverBalance = numNominal > currentBalance;
  const isInvalid = numNominal <= 0 || isOverBalance || alasan.trim().length < 5 || nomorKontak.trim().length < 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    setError(null);

    try {
      const res = await requestEmergencyWithdrawalAction({
        nominal: numNominal,
        alasan: alasan.trim(),
        nomorKontak: nomorKontak.trim(),
      });

      if (!res.success) {
        setError(res.error || 'Gagal mengajukan permohonan penarikan.');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNominal('');
    setAlasan('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F5132] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading">Ajukan Penarikan Mendesak</h3>
            <p className="text-xs text-emerald-100">Khusus kondisi darurat santri aktif</p>
          </div>
          <button
            onClick={handleClose}
            className="text-emerald-100 hover:text-white text-2xl leading-none"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">Permohonan Telah Diajukan!</h4>
              <p className="text-sm text-slate-600 mb-6">
                Permohonan penarikan tabungan mendesak sebesar <CurrencyDisplay amount={numNominal} /> telah diteruskan kepada Bendahara Komplek untuk verifikasi.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-[#0F5132] hover:bg-[#0b3d26] text-white font-medium rounded-xl transition"
              >
                Selesai
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <span className="font-semibold">Perhatian:</span> Penarikan tabungan saat santri masih aktif hanya diperbolehkan untuk kondisi darurat (medis, musibah). Setiap pengajuan akan ditinjau langsung oleh bendahara.
              </div>

              {/* Saldo Saat Ini */}
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-600 font-medium">Saldo Tabungan Saat Ini</span>
                <CurrencyDisplay amount={currentBalance} className="text-sm font-bold text-[#0F5132]" />
              </div>

              {/* Input Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Penarikan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 100000"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                    isOverBalance
                      ? 'border-red-300 focus:ring-red-400 text-red-700'
                      : 'border-slate-300 focus:ring-[#0F5132]'
                  }`}
                  required
                />
                {isOverBalance && (
                  <p className="text-xs text-red-600 mt-1">
                    Nominal melebihi saldo saat ini (Maksimal: <CurrencyDisplay amount={currentBalance} />)
                  </p>
                )}
              </div>

              {/* Input Alasan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Mendesak <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Jelaskan kebutuhan darurat Anda secara rinci (misal: pengobatan medis di RS)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-0.5">Minimal 5 karakter</p>
              </div>

              {/* Input Kontak WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Santri / Wali <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={nomorKontak}
                  onChange={(e) => setNomorKontak(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isInvalid || loading}
                  className="flex-1 py-2.5 px-4 bg-[#0F5132] hover:bg-[#0b3d26] disabled:bg-slate-300 text-white font-medium rounded-xl text-sm transition flex justify-center items-center gap-1.5"
                >
                  {loading ? (
                    <span>Mengirim...</span>
                  ) : (
                    <>
                      <span>Kirim Pengajuan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
