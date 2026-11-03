'use client';

import React, { useState } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { formatTanggalIndo } from '@/lib/formatters';
import {
  createExpenseAction,
  cancelExpenseAction,
  createExpenseCategoryAction,
} from '@/actions/expense.actions';

interface ExpenseItem {
  id: string;
  tanggal: string;
  nominal: number;
  keterangan: string;
  buktiUrl: string | null;
  status: string;
  alasanBatal: string | null;
  dibatalkanPada: Date | null;
  komplek?: { id: string; nama: string };
  kategoriPengeluaran?: { id: string; nama: string };
  dibuatOleh?: { nama: string };
}

interface Props {
  initialExpenses: ExpenseItem[];
  complexList: Array<{ id: string; nama: string }>;
  categoryList: Array<{ id: string; nama: string }>;
}

export function BendaharaExpensesClient({
  initialExpenses,
  complexList,
  categoryList,
}: Props) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialExpenses);
  const [categories, setCategories] = useState(categoryList);
  const [filterKomplek, setFilterKomplek] = useState('all');
  const [filterKategori, setFilterKategori] = useState('all');

  // Modal Input
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [komplekId, setKomplekId] = useState(complexList[0]?.id || '');
  const [kategoriId, setKategoriId] = useState(categories[0]?.id || '');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [buktiUrl, setBuktiUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal Cancel
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [alasanBatal, setAlasanBatal] = useState('');

  // Modal New Category
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const filteredExpenses = expenses.filter((e) => {
    if (filterKomplek !== 'all' && e.komplek?.id !== filterKomplek) return false;
    if (filterKategori !== 'all' && e.kategoriPengeluaran?.id !== filterKategori) return false;
    return true;
  });

  const totalPengeluaranAktif = filteredExpenses
    .filter((e) => e.status === 'aktif')
    .reduce((sum, e) => sum + Number(e.nominal), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await createExpenseAction({
        komplekId,
        kategoriPengeluaranId: kategoriId,
        tanggal,
        nominal: parseInt(nominal, 10),
        keterangan,
        buktiUrl: buktiUrl || null,
      });

      if (!res.success) {
        setError(res.error || 'Gagal menyimpan pengeluaran');
      } else {
        const added = {
          ...res.data,
          komplek: complexList.find((c) => c.id === komplekId),
          kategoriPengeluaran: categories.find((c) => c.id === kategoriId),
        };
        setExpenses([added, ...expenses]);
        setIsInputOpen(false);
        setNominal('');
        setKeterangan('');
        setBuktiUrl('');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExpense = async () => {
    if (!cancelTargetId) return;
    setLoading(true);
    try {
      const res = await cancelExpenseAction({
        pengeluaranId: cancelTargetId,
        alasanBatal,
      });
      if (res.success) {
        setExpenses(
          expenses.map((e) =>
            e.id === cancelTargetId
              ? { ...e, status: 'dibatalkan', alasanBatal, dibatalkanPada: new Date() }
              : e
          )
        );
        setCancelTargetId(null);
        setAlasanBatal('');
      } else {
        alert(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setLoading(true);
    try {
      const res = await createExpenseCategoryAction(newCatName);
      if (res.success && res.data) {
        setCategories([...categories, res.data]);
        setKategoriId(res.data.id);
        setIsCatOpen(false);
        setNewCatName('');
      } else {
        alert(res.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] tracking-tight">Pencatatan Pengeluaran</h1>
          <p className="text-sm text-[#757575]">Kelola pengeluaran operasional per komplek secara transparan</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCatOpen(true)}
            className="px-4 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm font-semibold text-[#111111] hover:bg-[#f6f5f4] transition bg-white shadow-none"
          >
            + Kategori
          </button>
          <button
            onClick={() => setIsInputOpen(true)}
            className="px-5 py-2 bg-[#0075de] hover:bg-[#0060b8] text-white rounded-[8px] text-sm font-semibold shadow-none transition flex items-center gap-2"
          >
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
          <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider">Total Pengeluaran Aktif</p>
          <p className="text-2xl font-bold text-[#111111] mt-1 font-mono">
            <CurrencyDisplay amount={totalPengeluaranAktif} />
          </p>
          <p className="text-xs text-[#757575] mt-1">{filteredExpenses.filter((e) => e.status === 'aktif').length} transaksi aktif</p>
        </div>
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
          <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider">Total Transaksi</p>
          <p className="text-2xl font-bold text-[#111111] mt-1 font-mono">{filteredExpenses.length}</p>
          <p className="text-xs text-[#757575] mt-1">Termasuk koreksi/batal</p>
        </div>
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
          <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider">Kategori Pengeluaran</p>
          <p className="text-2xl font-bold text-[#111111] mt-1 font-mono">{categories.length}</p>
          <p className="text-xs text-[#757575] mt-1">Kategori aktif</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-4 flex flex-wrap gap-4 items-center justify-between shadow-none">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs text-[#757575] block mb-1">Filter Komplek</label>
            <select
              value={filterKomplek}
              onChange={(e) => setFilterKomplek(e.target.value)}
              className="px-3 py-1.5 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm text-[#111111] bg-white focus:outline-none shadow-none"
            >
              <option value="all">Semua Komplek</option>
              {complexList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#757575] block mb-1">Filter Kategori</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-1.5 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm text-[#111111] bg-white focus:outline-none shadow-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#f6f5f4] border-b border-[rgba(0,0,0,0.08)] text-[rgba(0,0,0,0.6)] text-xs font-medium uppercase tracking-wider">
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Komplek</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Keterangan</th>
                <th className="px-5 py-3.5 text-right">Nominal</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#757575]">
                    Belum ada data pengeluaran yang tercatat
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className={e.status === 'dibatalkan' ? 'bg-[#fdeeed]/40 opacity-70' : 'hover:bg-[#f6f5f4]/80 transition'}>
                    <td className="px-5 py-4 whitespace-nowrap text-[#111111] font-medium">
                      {formatTanggalIndo(e.tanggal)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#111111]">
                      {e.komplek?.nama || '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f6f5f4] text-[#111111]">
                        {e.kategoriPengeluaran?.nama || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#111111] max-w-xs truncate" title={e.keterangan}>
                      {e.keterangan}
                      {e.status === 'dibatalkan' && e.alasanBatal && (
                        <div className="text-xs text-[#e32d14] mt-0.5 italic">
                          Batal: {e.alasanBatal}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-semibold text-[#111111]">
                      <CurrencyDisplay amount={e.nominal} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {e.status === 'aktif' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ebf5ee] text-[#2b6e4f] border border-[#2b6e4f]/20">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fdeeed] text-[#e32d14] border border-[#e32d14]/20">
                          Dibatalkan
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {e.status === 'aktif' && (
                        <button
                          onClick={() => {
                            setCancelTargetId(e.id);
                            setAlasanBatal('');
                          }}
                          className="text-xs text-[#e32d14] hover:text-[#b52411] font-semibold px-2 py-1 rounded hover:bg-[#fdeeed] transition"
                        >
                          Batalkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Pengeluaran */}
      {isInputOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] max-w-md w-full p-6 shadow-none border border-[rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-bold text-[#111111] mb-4">Catat Pengeluaran Baru</h2>
            {error && (
              <div className="mb-4 p-3 bg-[#fdeeed] border border-[#e32d14]/20 rounded-[8px] text-xs text-[#e32d14]">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#757575] block mb-1">Komplek</label>
                <select
                  value={komplekId}
                  onChange={(e) => setKomplekId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white focus:outline-none shadow-none"
                >
                  {complexList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#757575] block mb-1">Kategori Pengeluaran</label>
                <select
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white focus:outline-none shadow-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#757575] block mb-1">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white focus:outline-none shadow-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#757575] block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 150000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white focus:outline-none font-mono shadow-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#757575] block mb-1">Keterangan</label>
                <textarea
                  placeholder="Misal: Belanja beras &amp; lauk mingguan santri"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white focus:outline-none shadow-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInputOpen(false)}
                  className="px-4 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm font-semibold text-[#757575] hover:bg-[#f6f5f4] shadow-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#0075de] text-white rounded-[8px] text-sm font-semibold hover:bg-[#0060b8] shadow-none"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Batal Pengeluaran */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] max-w-sm w-full p-6 shadow-none border border-[rgba(0,0,0,0.08)]">
            <h2 className="text-base font-bold text-[#e32d14] mb-2">Batalkan Pengeluaran</h2>
            <p className="text-xs text-[#757575] mb-4">
              Pengeluaran akan ditandai dibatalkan dan tercatat di audit log (tidak dihapus).
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#757575] block mb-1">Alasan Pembatalan</label>
                <textarea
                  placeholder="Misal: Salah input nominal / nota dibatalkan"
                  value={alasanBatal}
                  onChange={(e) => setAlasanBatal(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white focus:outline-none shadow-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancelTargetId(null)}
                  className="px-3 py-1.5 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-xs font-semibold text-[#757575] shadow-none"
                >
                  Tutup
                </button>
                <button
                  onClick={handleCancelExpense}
                  disabled={loading || !alasanBatal.trim()}
                  className="px-4 py-1.5 bg-[#f64932] text-white rounded-[8px] text-xs font-semibold hover:bg-[#e32d14] disabled:opacity-50 shadow-none"
                >
                  {loading ? 'Proses...' : 'Konfirmasi Batal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Kategori */}
      {isCatOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[12px] max-w-sm w-full p-6 shadow-none border border-[rgba(0,0,0,0.08)]">
            <h2 className="text-base font-bold text-[#111111] mb-2">Tambah Kategori Pengeluaran</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#757575] block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Misal: Listrik &amp; Air, Konsumsi, Transportasi"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white focus:outline-none shadow-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCatOpen(false)}
                  className="px-3 py-1.5 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-xs font-semibold text-[#757575] shadow-none"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={loading || !newCatName.trim()}
                  className="px-4 py-1.5 bg-[#0075de] text-white rounded-[8px] text-xs font-semibold hover:bg-[#0060b8] disabled:opacity-50 shadow-none"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
