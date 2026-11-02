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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#DC2626] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading">Proses Penarikan Tabungan</h3>
            <p className="text-xs text-red-100">Penarikan dana tunai dari ledger tabungan santri</p>
          </div>
          <button
            onClick={handleClose}
            className="text-red-100 hover:text-white text-2xl leading-none"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Santri Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Santri <span className="text-red-500">*</span>
            </label>
            <select
              value={santriId}
              onChange={(e) => handleSelectSantri(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div>
                <span className="text-xs text-slate-600 font-medium block">Saldo Tabungan Saat Ini</span>
                <span className="text-[11px] text-slate-400">Tersedia untuk ditarik</span>
              </div>
              <div className="text-right">
                <CurrencyDisplay amount={currentBalance} className="text-base font-bold text-slate-800" />
                {currentBalance > 0 && (
                  <button
                    type="button"
                    onClick={handleWithdrawAll}
                    className="block text-[11px] text-emerald-600 font-semibold hover:underline mt-0.5 ml-auto"
                  >
                    Tarik Semua Saldo
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Jenis Penarikan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori Penarikan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                  jenisMutasi === 'penarikan_mendesak'
                    ? 'border-red-500 bg-red-50/50 text-red-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="jenisMutasi"
                    value="penarikan_mendesak"
                    checked={jenisMutasi === 'penarikan_mendesak'}
                    onChange={() => setJenisMutasi('penarikan_mendesak')}
                    className="accent-red-600"
                  />
                  <span className="text-xs font-bold">Penarikan Mendesak</span>
                </div>
                <span className="text-[10px] text-slate-500">Kondisi darurat santri aktif</span>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                  jenisMutasi === 'penarikan_boyong'
                    ? 'border-red-500 bg-red-50/50 text-red-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
                    className="accent-red-600"
                  />
                  <span className="text-xs font-bold">Penarikan Boyong</span>
                </div>
                <span className="text-[10px] text-slate-500">Santri lulus / keluar pondok</span>
              </label>
            </div>
          </div>

          {/* Nominal */}
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
              placeholder="Contoh: 150000"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 ${
                isOverBalance
                  ? 'border-red-400 focus:ring-red-500 text-red-700'
                  : 'border-slate-300 focus:ring-red-500'
              }`}
              required
            />
            {isOverBalance && (
              <p className="text-xs text-red-600 font-medium mt-1">
                Saldo tabungan tidak mencukupi! Maksimal penarikan: Rp{currentBalance.toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* Nama Penerima Dana */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diserahkan Kepada (Nama Penerima) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={diserahkanKepada}
              onChange={(e) => setDiserahkanKepada(e.target.value)}
              placeholder="Nama santri atau nama wali santri yang menerima dana tunai"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* Alasan Penarikan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan / Justifikasi Penarikan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Misal: Biaya perawatan santri sakit di RS atau pengembalian sisa tabungan saat boyong..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-0.5">Minimal 5 karakter</p>
          </div>

          {/* Ubah status boyong checkbox */}
          {jenisMutasi === 'penarikan_boyong' && (
            <label className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={ubahStatusBoyong}
                onChange={(e) => setUbahStatusBoyong(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded"
              />
              <span className="text-xs text-amber-900 font-medium">
                Otomatis ubah status profil santri menjadi <strong>Boyong</strong>
              </span>
            </label>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

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
              className="flex-1 py-2.5 px-4 bg-[#DC2626] hover:bg-red-700 disabled:bg-slate-300 text-white font-medium rounded-xl text-sm transition"
            >
              {loading ? 'Memproses...' : 'Konfirmasi Penarikan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
