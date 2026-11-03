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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-[12px] max-w-md w-full shadow-none border border-[rgba(0,0,0,0.08)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0075de] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading">Ajukan Penarikan Mendesak</h3>
            <p className="text-xs text-blue-100">Khusus kondisi darurat santri aktif</p>
          </div>
          <button
            onClick={handleClose}
            className="text-blue-100 hover:text-white text-2xl leading-none cursor-pointer"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#ebf5ee] text-[#2b6e4f] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-[#111111] mb-1">Permohonan Telah Diajukan!</h4>
              <p className="text-sm text-[#757575] mb-6">
                Permohonan penarikan tabungan mendesak sebesar <CurrencyDisplay amount={numNominal} /> telah diteruskan kepada Bendahara Komplek untuk verifikasi.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 bg-[#0075de] hover:bg-[#0060b8] text-white font-medium rounded-[8px] transition cursor-pointer"
              >
                Selesai
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-[#fff6e5] border border-[#fde2a7] rounded-[8px] p-3 text-xs text-[#b47800]">
                <span className="font-semibold">Perhatian:</span> Penarikan tabungan saat santri masih aktif hanya diperbolehkan untuk kondisi darurat (medis, musibah). Setiap pengajuan akan ditinjau langsung oleh bendahara.
              </div>

              {/* Saldo Saat Ini */}
              <div className="flex justify-between items-center bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] rounded-[8px] p-3">
                <span className="text-xs text-[#757575] font-medium">Saldo Tabungan Saat Ini</span>
                <CurrencyDisplay amount={currentBalance} className="text-sm font-bold text-[#0075de]" />
              </div>

              {/* Input Nominal */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Nominal Penarikan (Rp) <span className="text-[#e32d14]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentBalance}
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 100000"
                  className={`w-full px-3.5 py-2.5 rounded-[8px] border text-sm font-mono focus:outline-none focus:ring-1 ${
                    isOverBalance
                      ? 'border-[#e32d14] focus:ring-[#e32d14] text-[#e32d14]'
                      : 'border-[rgba(0,0,0,0.12)] focus:ring-[#0075de] text-[#111111]'
                  }`}
                  required
                />
                {isOverBalance && (
                  <p className="text-xs text-[#e32d14] mt-1">
                    Nominal melebihi saldo saat ini (Maksimal: <CurrencyDisplay amount={currentBalance} />)
                  </p>
                )}
              </div>

              {/* Input Alasan */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Alasan Mendesak <span className="text-[#e32d14]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder="Jelaskan kebutuhan darurat Anda secara rinci (misal: pengobatan medis di RS)..."
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#0075de]"
                  required
                />
                <p className="text-[11px] text-[#757575] mt-0.5">Minimal 5 karakter</p>
              </div>

              {/* Input Kontak WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-[#111111] mb-1">
                  Nomor WhatsApp Santri / Wali <span className="text-[#e32d14]">*</span>
                </label>
                <input
                  type="tel"
                  value={nomorKontak}
                  onChange={(e) => setNomorKontak(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#0075de]"
                  required
                />
              </div>

              {error && (
                <div className="bg-[#fdeeed] border border-[rgba(227,45,20,0.2)] text-[#e32d14] text-xs rounded-[8px] p-3">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-white border border-[rgba(0,0,0,0.12)] hover:bg-[#f6f5f4] text-[#111111] font-medium rounded-[8px] text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isInvalid || loading}
                  className="flex-1 py-2.5 px-4 bg-[#0075de] hover:bg-[#0060b8] disabled:bg-[rgba(0,0,0,0.12)] text-white font-medium rounded-[8px] text-sm transition flex justify-center items-center gap-1.5 cursor-pointer"
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
