'use client';

import React, { useState, useEffect } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { processSavingsWithdrawalAction } from '@/actions/savings.actions';

interface SantriOption {
  id: string;
  nis: string;
  nama: string;
  komplekKode?: string;
  saldoTabungan?: number;
  status?: string;
}

interface WithdrawalProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: SantriOption[];
  preselectedSantriId?: string | null;
  onSuccess?: () => void;
}

export function WithdrawalProcessModal({
  isOpen,
  onClose,
  santriList,
  preselectedSantriId,
  onSuccess,
}: WithdrawalProcessModalProps) {
  const [santriId, setSantriId] = useState(preselectedSantriId || '');
  const [jenisMutasi, setJenisMutasi] = useState<'penarikan_mendesak' | 'penarikan_boyong'>('penarikan_mendesak');
  const [nominal, setNominal] = useState<number | ''>('');
  const [alasan, setAlasan] = useState('');
  const [diserahkanKepada, setDiserahkanKepada] = useState('');
  const [ubahStatusBoyong, setUbahStatusBoyong] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedSantriId) {
      setSantriId(preselectedSantriId);
    }
  }, [preselectedSantriId]);

  if (!isOpen) return null;

  const selectedSantri = santriList.find((s) => s.id === santriId);
  const currentBalance = selectedSantri?.saldoTabungan || 0;
  const numNominal = Number(nominal) || 0;
  const isOverBalance = numNominal > currentBalance;
  const isInvalid =
    !santriId ||
    numNominal <= 0 ||
    isOverBalance ||
    alasan.trim().length < 5 ||
    diserahkanKepada.trim().length < 3;

  const handleSelectSantri = (id: string) => {
    setSantriId(id);
    const s = santriList.find((item) => item.id === id);
    if (s) {
      setDiserahkanKepada(s.nama);
    }
  };

  const handleWithdrawAll = () => {
    setNominal(currentBalance);
    if (jenisMutasi === 'penarikan_boyong') {
      setUbahStatusBoyong(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    setError(null);

    try {
      const res = await processSavingsWithdrawalAction({
        santriId,
        nominal: numNominal,
        jenisMutasi,
        alasan: alasan.trim(),
        diserahkanKepada: diserahkanKepada.trim(),
        ubahStatusBoyong: jenisMutasi === 'penarikan_boyong' && ubahStatusBoyong,
      });

      if (!res.success) {
        setError(res.error || 'Gagal memproses penarikan tabungan.');
      } else {
        onSuccess?.();
        handleClose();
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
    setDiserahkanKepada('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[18px] max-w-lg w-full shadow-2xl border border-[#E8E8E8] overflow-hidden">
        {/* Header */}
        <div className="bg-[#C84C5A] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-sans text-white">Proses Penarikan Tabungan</h3>
            <p className="text-xs text-[#FCEDEF]">Penarikan dana tunai dari ledger tabungan santri</p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#FCEDEF] hover:text-white text-2xl leading-none cursor-pointer"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Santri Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#202119] mb-1">
              Pilih Santri <span className="text-[#C84C5A]">*</span>
            </label>
            <select
              value={santriId}
              onChange={(e) => handleSelectSantri(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8E8] text-sm text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4] bg-white shadow-none"
              required
            >
              <option value="">-- Pilih Santri --</option>
              {santriList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nis} - {s.nama} (Saldo: Rp{(s.saldoTabungan || 0).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          {/* Current Balance Display */}
          {santriId && (
            <div className="flex justify-between items-center bg-[#F5F5F5] border border-[#E8E8E8] rounded-[18px] p-3">
              <div>
                <span className="text-xs text-[#626262] font-medium block">Saldo Tabungan Saat Ini</span>
                <span className="text-[11px] text-[#626262]">Tersedia untuk ditarik</span>
              </div>
              <div className="text-right">
                <CurrencyDisplay amount={currentBalance} className="text-base font-bold text-[#202119] font-mono tabular-nums" />
                {currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={handleWithdrawAll}
                    className="block text-[11px] text-[#202119] font-semibold hover:underline mt-0.5 ml-auto cursor-pointer"
                  >
                    Tarik Semua Saldo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Jenis Penarikan */}
          <div>
            <label className="block text-xs font-semibold text-[#202119] mb-1">
              Kategori Penarikan <span className="text-[#C84C5A]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-[8px] border cursor-pointer flex flex-col justify-between transition ${
                  jenisMutasi === 'penarikan_mendesak'
                    ? 'border-[#C84C5A] bg-[#FCEDEF] text-[#C84C5A]'
                    : 'border-[#E8E8E8] bg-white text-[#626262] hover:bg-[#F5F5F5]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="jenisMutasi"
                    value="penarikan_mendesak"
                    checked={jenisMutasi === 'penarikan_mendesak'}
                    onChange={() => setJenisMutasi('penarikan_mendesak')}
                    className="accent-[#C84C5A]"
                  />
                  <span className="text-xs font-bold">Penarikan Mendesak</span>
                </div>
                <span className="text-[10px] text-[#626262]">Kondisi darurat santri aktif</span>
              </label>

              <label
                className={`p-3 rounded-[8px] border cursor-pointer flex flex-col justify-between transition ${
                  jenisMutasi === 'penarikan_boyong'
                    ? 'border-[#C84C5A] bg-[#FCEDEF] text-[#C84C5A]'
                    : 'border-[#E8E8E8] bg-white text-[#626262] hover:bg-[#F5F5F5]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="jenisMutasi"
                    value="penarikan_boyong"
                    checked={jenisMutasi === 'penarikan_boyong'}
                    onChange={() => {
                      setJenisMutasi('penarikan_boyong');
                      setUbahStatusBoyong(true);
                    }}
                    className="accent-[#C84C5A]"
                  />
                  <span className="text-xs font-bold">Penarikan Boyong</span>
                </div>
                <span className="text-[10px] text-[#626262]">Santri lulus / keluar pondok</span>
              </label>
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-[#202119] mb-1">
              Nominal Penarikan (Rp) <span className="text-[#C84C5A]">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={currentBalance}
              value={nominal}
              onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Contoh: 150000"
              className={`w-full px-3.5 py-2.5 rounded-[8px] border text-sm font-mono text-[#202119] focus:outline-none focus:ring-1 bg-white shadow-none ${
                isOverBalance
                  ? 'border-[#C84C5A] focus:ring-[#C84C5A] text-[#C84C5A]'
                  : 'border-[#E8E8E8] focus:ring-[#315FC4]'
              }`}
              required
            />
            {isOverBalance && (
              <p className="text-xs text-[#C84C5A] font-medium mt-1">
                Saldo tabungan tidak mencukupi! Maksimal penarikan: Rp{currentBalance.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Nama Penerima Dana */}
          <div>
            <label className="block text-xs font-semibold text-[#202119] mb-1">
              Diserahkan Kepada (Nama Penerima) <span className="text-[#C84C5A]">*</span>
            </label>
            <input
              type="text"
              value={diserahkanKepada}
              onChange={(e) => setDiserahkanKepada(e.target.value)}
              placeholder="Nama santri atau nama wali santri yang menerima dana tunai"
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8E8] text-sm text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4] bg-white shadow-none"
              required
            />
          </div>

          {/* Alasan Penarikan */}
          <div>
            <label className="block text-xs font-semibold text-[#202119] mb-1">
              Alasan / Justifikasi Penarikan <span className="text-[#C84C5A]">*</span>
            </label>
            <textarea
              rows={2}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Misal: Biaya perawatan santri sakit di RS atau pengembalian sisa tabungan saat boyong..."
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[#E8E8E8] text-sm text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4] bg-white shadow-none"
              required
            />
            <p className="text-[11px] text-[#626262] mt-0.5">Minimal 5 karakter</p>
          </div>

          {/* Ubah status boyong checkbox */}
          {jenisMutasi === 'penarikan_boyong' && (
            <label className="flex items-center gap-2 p-3 bg-[#FFF7ED] border border-[rgba(194,65,12,0.2)] rounded-[8px] cursor-pointer">
              <input
                type="checkbox"
                checked={ubahStatusBoyong}
                onChange={(e) => setUbahStatusBoyong(e.target.checked)}
                className="w-4 h-4 accent-[#C2410C] rounded"
              />
              <span className="text-xs text-[#C2410C] font-medium">
                Otomatis ubah status profil santri menjadi <strong>Boyong</strong>
              </span>
            </label>
          )}

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
              className="flex-1 py-2.5 px-4 bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#202119] font-medium rounded-[8px] text-sm transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isInvalid || loading}
              className="flex-1 py-2.5 px-4 bg-[#C84C5A] hover:bg-[#b03d4a] disabled:bg-[#F5F5F5] disabled:text-[#747474] text-white font-medium rounded-[8px] text-sm transition shadow-none cursor-pointer focus-visible:ring-[#315FC4]"
            >
              {loading ? 'Memproses...' : 'Konfirmasi Penarikan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
