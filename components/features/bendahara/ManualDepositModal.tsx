'use client';

import React, { useState, useEffect } from 'react';
import { recordManualDepositAction } from '@/actions/savings.actions';

interface SantriOption {
  id: string;
  nis: string;
  nama: string;
  komplekKode?: string;
  saldoTabungan?: number;
}

interface ManualDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  santriList: SantriOption[];
  preselectedSantriId?: string | null;
  onSuccess?: () => void;
}

export function ManualDepositModal({
  isOpen,
  onClose,
  santriList,
  preselectedSantriId,
  onSuccess,
}: ManualDepositModalProps) {
  const [santriId, setSantriId] = useState(preselectedSantriId || '');
  const [jenisMutasi, setJenisMutasi] = useState<'saldo_awal' | 'koreksi'>('saldo_awal');
  const [nominal, setNominal] = useState<number | ''>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedSantriId) {
      setSantriId(preselectedSantriId);
    }
  }, [preselectedSantriId]);

  if (!isOpen) return null;

  const numNominal = Number(nominal) || 0;
  const isInvalid = !santriId || numNominal <= 0 || keterangan.trim().length < 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    setError(null);

    try {
      const res = await recordManualDepositAction({
        santriId,
        nominal: numNominal,
        jenisMutasi,
        keterangan: keterangan.trim(),
        tanggal,
      });

      if (!res.success) {
        setError(res.error || 'Gagal mencatat mutasi tabungan.');
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
    setKeterangan('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[12px] max-w-lg w-full shadow-none border border-[rgba(0,0,0,0.08)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0075de] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading">Setor Saldo Awal / Koreksi</h3>
            <p className="text-xs text-[#e6f3fe]">Pencatatan pembukuan saldo tabungan santri</p>
          </div>
          <button
            onClick={handleClose}
            className="text-[#e6f3fe] hover:text-white text-2xl leading-none"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Santri Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">
              Pilih Santri <span className="text-[#e32d14]">*</span>
            </label>
            <select
              value={santriId}
              onChange={(e) => setSantriId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-sm focus:outline-none focus:ring-1 focus:ring-[#0075de] bg-white shadow-none"
              required
            >
              <option value="">-- Pilih Santri --</option>
              {santriList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nis} - {s.nama} ({s.komplekKode || '-'})
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Mutasi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Jenis Mutasi <span className="text-[#e32d14]">*</span>
              </label>
              <select
                value={jenisMutasi}
                onChange={(e) => setJenisMutasi(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-sm focus:outline-none focus:ring-1 focus:ring-[#0075de] bg-white shadow-none"
              >
                <option value="saldo_awal">Saldo Awal (Migrasi)</option>
                <option value="koreksi">Koreksi Saldo (+)</option>
              </select>
            </div>

            {/* Tanggal Transaksi */}
            <div>
              <label className="block text-xs font-semibold text-[#111111] mb-1">
                Tanggal Transaksi <span className="text-[#e32d14]">*</span>
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-sm focus:outline-none focus:ring-1 focus:ring-[#0075de] bg-white shadow-none"
                required
              />
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">
              Nominal Setoran (Rp) <span className="text-[#e32d14]">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={nominal}
              onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Contoh: 200000"
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#0075de] bg-white shadow-none"
              required
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-[#111111] mb-1">
              Keterangan Pembukuan <span className="text-[#e32d14]">*</span>
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan sumber dana (misal: Saldo tabungan bawaan dari pondok lama)..."
              className="w-full px-3.5 py-2.5 rounded-[8px] border border-[rgba(0,0,0,0.12)] text-sm focus:outline-none focus:ring-1 focus:ring-[#0075de] bg-white shadow-none"
              required
            />
            <p className="text-[11px] text-[#757575] mt-0.5">Minimal 5 karakter</p>
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
              className="flex-1 py-2.5 px-4 bg-[#f6f5f4] hover:bg-[rgba(0,0,0,0.08)] text-[#111111] font-medium rounded-[8px] text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isInvalid || loading}
              className="flex-1 py-2.5 px-4 bg-[#0075de] hover:bg-[#0060b8] disabled:bg-[rgba(0,0,0,0.08)] disabled:text-[#757575] text-white font-medium rounded-[8px] text-sm transition shadow-none"
            >
              {loading ? 'Menyimpan...' : 'Simpan Mutasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
