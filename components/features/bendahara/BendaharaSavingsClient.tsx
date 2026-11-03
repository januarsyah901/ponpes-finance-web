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
          <h1 className="text-2xl font-bold font-heading text-[#111111] tracking-tight">
            Manajemen Tabungan Santri
          </h1>
          <p className="text-sm text-[#757575]">
            Tata kelola buku besar simpanan santri berbasis mutasi strictly-derived
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenDeposit()}
            className="py-2 px-3.5 bg-[#0075de] hover:bg-[#0060b8] text-white text-xs sm:text-sm font-medium rounded-[8px] shadow-none transition flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Setor Saldo Awal
          </button>
          <button
            onClick={() => handleOpenWithdraw()}
            className="py-2 px-3.5 bg-[#f64932] hover:bg-[#e32d14] text-white text-xs sm:text-sm font-medium rounded-[8px] shadow-none transition flex items-center gap-1.5 cursor-pointer"
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
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
          <span className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider block mb-1">Total Dana Tabungan</span>
          <CurrencyDisplay
            amount={kpiData.totalSavings}
            className="text-2xl font-bold font-mono text-[#0075de]"
          />
          <p className="text-[11px] text-[#757575] mt-1.5">Seluruh komplek wewenang</p>
        </div>

        {/* Santri Aktif dengan Saldo */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
          <span className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider block mb-1">Santri Memiliki Saldo</span>
          <div className="text-2xl font-bold font-mono text-[#111111]">
            {kpiData.activeSantriWithBalance}{' '}
            <span className="text-xs font-normal text-[#757575] font-sans">Santri</span>
          </div>
          <p className="text-[11px] text-[#757575] mt-1.5">Saldo &gt; Rp0</p>
        </div>

        {/* Penyetoran Bulan Ini */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
          <span className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider block mb-1">Penyetoran Bulan Ini</span>
          <CurrencyDisplay
            amount={kpiData.monthlyCredit}
            showSign
            className="text-2xl font-bold font-mono text-[#2b6e4f]"
          />
          <p className="text-[11px] text-[#757575] mt-1.5">Alokasi syahriah & saldo awal</p>
        </div>

        {/* Penarikan Bulan Ini */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
          <span className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider block mb-1">Penarikan Bulan Ini</span>
          <CurrencyDisplay
            amount={kpiData.monthlyDebit}
            className="text-2xl font-bold font-mono text-[#e32d14]"
          />
          <p className="text-[11px] text-[#757575] mt-1.5">Boyong, mendesak, kegiatan</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] overflow-hidden shadow-none">
        {/* Filters Bar */}
        <div className="p-4 border-b border-[rgba(0,0,0,0.08)] bg-[#f6f5f4] flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <svg
              className="w-4 h-4 text-[#757575] absolute left-3.5 top-1/2 -translate-y-1/2"
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
              className="w-full pl-10 pr-4 py-2 bg-white border border-[rgba(0,0,0,0.12)] rounded-[8px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#0075de]"
            />
          </div>

          {/* Complex Dropdown */}
          <select
            value={selectedComplex}
            onChange={(e) => setSelectedComplex(e.target.value)}
            className="px-3 py-2 bg-white border border-[rgba(0,0,0,0.12)] rounded-[8px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#0075de]"
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
            className="px-3 py-2 bg-white border border-[rgba(0,0,0,0.12)] rounded-[8px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#0075de]"
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
            className="px-3 py-2 bg-white border border-[rgba(0,0,0,0.12)] rounded-[8px] text-xs sm:text-sm text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#0075de]"
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
              <tr className="bg-[#f6f5f4] border-b border-[rgba(0,0,0,0.08)] text-[rgba(0,0,0,0.6)] font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Santri & Komplek</th>
                <th className="py-3 px-4">Saldo Tabungan</th>
                <th className="py-3 px-4">Penyetoran</th>
                <th className="py-3 px-4">Penarikan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#757575]">
                    Tidak ditemukan data tabungan santri yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-[rgba(55,53,47,0.02)] transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#111111]">
                      {item.nis}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#111111]">{item.nama}</div>
                      <div className="text-[11px] text-[#757575]">
                        {item.komplekKode} • {item.kategoriNama}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#111111]">
                      <CurrencyDisplay amount={item.saldoTabungan} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#2b6e4f] font-semibold">
                      <CurrencyDisplay amount={item.totalCredit} showSign />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#e32d14] font-semibold">
                      <CurrencyDisplay amount={item.totalDebit} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === 'aktif'
                            ? 'bg-[#ebf5ee] text-[#2b6e4f] border border-[rgba(43,110,79,0.2)]'
                            : 'bg-[#f1f1ef] text-[#5a5a58] border border-[rgba(90,90,88,0.2)]'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenDrawer(item)}
                          className="py-1 px-2.5 bg-white border border-[rgba(0,0,0,0.12)] hover:bg-[#f6f5f4] text-[#111111] rounded-[6px] text-xs font-medium transition cursor-pointer"
                          title="Lihat Buku Tabungan"
                        >
                          Buku Tabungan
                        </button>
                        <button
                          onClick={() => handleOpenDeposit(item)}
                          className="py-1 px-2.5 bg-[#e6f3fe] hover:bg-[#d5ebfd] text-[#0075de] border border-[rgba(0,117,222,0.2)] rounded-[6px] text-xs font-medium transition cursor-pointer"
                          title="Setor Saldo"
                        >
                          Setor
                        </button>
                        <button
                          onClick={() => handleOpenWithdraw(item)}
                          className="py-1 px-2.5 bg-[#fdeeed] hover:bg-[#fbdcd9] text-[#e32d14] border border-[#f9c5c0] rounded-[6px] text-xs font-medium transition cursor-pointer"
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
