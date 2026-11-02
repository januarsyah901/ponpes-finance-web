'use client';

import React, { useState, useMemo } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { ManualDepositModal } from './ManualDepositModal';
import { WithdrawalProcessModal } from './WithdrawalProcessModal';
import { SantriLedgerDrawer } from './SantriLedgerDrawer';
import { formatTanggalIndo } from '@/lib/formatters';
import { useRouter } from 'next/navigation';

interface ComplexItem {
  id: string;
  kode: string;
  nama: string;
}

interface SantriSavingsItem {
  id: string;
  nis: string;
  nama: string;
  status: string;
  komplekId: string;
  komplekKode: string;
  komplekNama: string;
  kategoriKode: string;
  kategoriNama: string;
  saldoTabungan: number;
  totalCredit: number;
  totalDebit: number;
  terakhirMutasi?: string | null;
}

interface KpiData {
  totalSavings: number;
  activeSantriWithBalance: number;
  monthlyCredit: number;
  monthlyDebit: number;
}

interface BendaharaSavingsClientProps {
  complexList: ComplexItem[];
  initialSantriList: SantriSavingsItem[];
  kpiData: KpiData;
}

export function BendaharaSavingsClient({
  complexList,
  initialSantriList,
  kpiData,
}: BendaharaSavingsClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplex, setSelectedComplex] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSantri, setActiveSantri] = useState<SantriSavingsItem | null>(null);

  // Filtered santri list
  const filteredList = useMemo(() => {
    return initialSantriList.filter((s) => {
      // Search
      const searchMatch =
        !searchTerm ||
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase());

      // Complex
      const complexMatch = selectedComplex === 'all' || s.komplekId === selectedComplex;

      // Category
      const categoryMatch = selectedCategory === 'all' || s.kategoriKode === selectedCategory;

      // Status
      const statusMatch = selectedStatus === 'all' || s.status === selectedStatus;

      return searchMatch && complexMatch && categoryMatch && statusMatch;
    });
  }, [initialSantriList, searchTerm, selectedComplex, selectedCategory, selectedStatus]);

  const handleOpenDrawer = (item: SantriSavingsItem) => {
    setActiveSantri(item);
    setIsDrawerOpen(true);
  };

  const handleOpenDeposit = (item?: SantriSavingsItem) => {
    if (item) setActiveSantri(item);
    setIsDepositOpen(true);
  };

  const handleOpenWithdraw = (item?: SantriSavingsItem) => {
    if (item) setActiveSantri(item);
    setIsWithdrawOpen(true);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Manajemen Tabungan Santri
          </h1>
          <p className="text-sm text-slate-500">
            Tata kelola buku besar simpanan santri berbasis mutasi strictly-derived
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenDeposit()}
            className="py-2.5 px-4 bg-[#0F5132] hover:bg-[#0b3d26] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Setor Saldo Awal
          </button>
          <button
            onClick={() => handleOpenWithdraw()}
            className="py-2.5 px-4 bg-[#DC2626] hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
            Proses Penarikan
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tabungan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Dana Tabungan</span>
          <CurrencyDisplay
            amount={kpiData.totalSavings}
            className="text-2xl font-extrabold font-mono text-[#0F5132]"
          />
          <p className="text-[11px] text-slate-400 mt-2">Seluruh komplek wewenang</p>
        </div>

        {/* Santri Aktif dengan Saldo */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">Santri Memiliki Saldo</span>
          <div className="text-2xl font-extrabold font-mono text-slate-800">
            {kpiData.activeSantriWithBalance}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">Santri</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Saldo &gt; Rp0</p>
        </div>

        {/* Penyetoran Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">Penyetoran Bulan Ini</span>
          <CurrencyDisplay
            amount={kpiData.monthlyCredit}
            showSign
            className="text-2xl font-extrabold font-mono text-emerald-600"
          />
          <p className="text-[11px] text-slate-400 mt-2">Alokasi syahriah & saldo awal</p>
        </div>

        {/* Penarikan Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block mb-1">Penarikan Bulan Ini</span>
          <CurrencyDisplay
            amount={kpiData.monthlyDebit}
            className="text-2xl font-extrabold font-mono text-red-600"
          />
          <p className="text-[11px] text-slate-400 mt-2">Boyong, mendesak, kegiatan</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari santri berdasarkan Nama atau NIS..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
            />
          </div>

          {/* Complex Dropdown */}
          <select
            value={selectedComplex}
            onChange={(e) => setSelectedComplex(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="all">Semua Komplek</option>
            {complexList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kode} - {c.nama}
              </option>
            ))}
          </select>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="all">Semua Kategori</option>
            <option value="pengurus">Pengurus</option>
            <option value="non_pengurus">Non Pengurus</option>
            <option value="mbak_ndalem">Mbak Ndalem</option>
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
          >
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="boyong">Boyong</option>
          </select>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Santri & Komplek</th>
                <th className="py-3 px-4">Saldo Tabungan</th>
                <th className="py-3 px-4">Penyetoran</th>
                <th className="py-3 px-4">Penarikan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data tabungan santri yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {item.nis}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.nama}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.komplekKode} • {item.kategoriNama}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <CurrencyDisplay amount={item.saldoTabungan} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700">
                      <CurrencyDisplay amount={item.totalCredit} showSign />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-red-600">
                      <CurrencyDisplay amount={item.totalDebit} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'aktif'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDrawer(item)}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                          title="Lihat Buku Tabungan"
                        >
                          Buku Tabungan
                        </button>
                        <button
                          onClick={() => handleOpenDeposit(item)}
                          className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition"
                          title="Setor Saldo"
                        >
                          Setor
                        </button>
                        <button
                          onClick={() => handleOpenWithdraw(item)}
                          className="py-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition"
                          title="Tarik Dana"
                        >
                          Tarik
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Deposit Modal */}
      <ManualDepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        santriList={initialSantriList}
        preselectedSantriId={activeSantri?.id}
        onSuccess={handleRefresh}
      />

      {/* Withdrawal Process Modal */}
      <WithdrawalProcessModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        santriList={initialSantriList}
        preselectedSantriId={activeSantri?.id}
        onSuccess={handleRefresh}
      />

      {/* Santri Ledger Drawer */}
      <SantriLedgerDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        santri={activeSantri}
        mutations={[]}
        onOpenDeposit={() => handleOpenDeposit(activeSantri!)}
        onOpenWithdraw={() => handleOpenWithdraw(activeSantri!)}
      />
    </div>
  );
}
