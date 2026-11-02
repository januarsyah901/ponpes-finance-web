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
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Pencatatan Pengeluaran</h1>
          <p className="text-sm text-[#64748B]">Kelola pengeluaran operasional per komplek secara transparan</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCatOpen(true)}
            className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition"
          >
            + Kategori
          </button>
          <button
            onClick={() => setIsInputOpen(true)}
            className="px-5 py-2 bg-[#0F5132] hover:bg-[#0c3e27] text-white rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2"
          >
            <span>+ Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Pengeluaran Aktif</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-1 font-mono">
            <CurrencyDisplay amount={totalPengeluaranAktif} />
          </p>
          <p className="text-xs text-[#64748B] mt-1">{filteredExpenses.filter((e) => e.status === 'aktif').length} transaksi aktif</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Transaksi</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-1 font-mono">{filteredExpenses.length}</p>
          <p className="text-xs text-[#64748B] mt-1">Termasuk koreksi/batal</p>
        </div>
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Kategori Pengeluaran</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-1 font-mono">{categories.length}</p>
          <p className="text-xs text-[#64748B] mt-1">Kategori aktif</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs text-[#64748B] block mb-1">Filter Komplek</label>
            <select
              value={filterKomplek}
              onChange={(e) => setFilterKomplek(e.target.value)}
              className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] bg-slate-50 focus:outline-none"
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
            <label className="text-xs text-[#64748B] block mb-1">Filter Kategori</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] bg-slate-50 focus:outline-none"
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
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Komplek</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Keterangan</th>
                <th className="px-5 py-3.5 text-right">Nominal</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#64748B]">
                    Belum ada data pengeluaran yang tercatat
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className={e.status === 'dibatalkan' ? 'bg-red-50/40 opacity-70' : 'hover:bg-slate-50/80 transition'}>
                    <td className="px-5 py-4 whitespace-nowrap text-[#0F172A] font-medium">
                      {formatTanggalIndo(e.tanggal)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-[#0F172A]">
                      {e.komplek?.nama || '-'}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {e.kategoriPengeluaran?.nama || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#0F172A] max-w-xs truncate" title={e.keterangan}>
                      {e.keterangan}
                      {e.status === 'dibatalkan' && e.alasanBatal && (
                        <div className="text-xs text-red-600 mt-0.5 italic">
                          Batal: {e.alasanBatal}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-semibold text-[#0F172A]">
                      <CurrencyDisplay amount={e.nominal} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {e.status === 'aktif' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#0F5132] border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
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
                          className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E2E8F0]">
            <h2 className="text-lg font-bold text-[#0F172A] mb-4">Catat Pengeluaran Baru</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">Komplek</label>
                <select
                  value={komplekId}
                  onChange={(e) => setKomplekId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 focus:outline-none"
                >
                  {complexList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">Kategori Pengeluaran</label>
                <select
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 150000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">Keterangan</label>
                <textarea
                  placeholder="Misal: Belanja beras & lauk mingguan santri"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInputOpen(false)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-sm font-semibold text-[#64748B] hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#0F5132] text-white rounded-xl text-sm font-semibold hover:bg-[#0c3e27]"
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0]">
            <h2 className="text-base font-bold text-red-600 mb-2">Batalkan Pengeluaran</h2>
            <p className="text-xs text-[#64748B] mb-4">
              Pengeluaran akan ditandai dibatalkan dan tercatat di audit log (tidak dihapus).
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">Alasan Pembatalan</label>
                <textarea
                  placeholder="Misal: Salah input nominal / nota dibatalkan"
                  value={alasanBatal}
                  onChange={(e) => setAlasanBatal(e.target.value)}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancelTargetId(null)}
                  className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B]"
                >
                  Tutup
                </button>
                <button
                  onClick={handleCancelExpense}
                  disabled={loading || !alasanBatal.trim()}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50"
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
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E2E8F0]">
            <h2 className="text-base font-bold text-[#0F172A] mb-2">Tambah Kategori Pengeluaran</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#64748B] block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Misal: Listrik & Air, Konsumsi, Transportasi"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCatOpen(false)}
                  className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={loading || !newCatName.trim()}
                  className="px-4 py-1.5 bg-[#0F5132] text-white rounded-xl text-xs font-semibold hover:bg-[#0c3e27] disabled:opacity-50"
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
