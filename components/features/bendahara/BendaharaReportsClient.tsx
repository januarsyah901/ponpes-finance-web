'use client';

import React, { useState } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { formatTanggalIndo } from '@/lib/formatters';
import { getFinancialSummaryAction, getSantriSavingsReportAction } from '@/actions/report.actions';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ComplexItem {
  id: string;
  nama: string;
}

interface FinancialSummaryData {
  periode: {
    startDate: string;
    endDate: string;
  };
  pemasukan: {
    totalPemasukan: number;
    alokasiOperasional: number;
    alokasiTabungan: number;
  };
  pengeluaran: {
    totalPengeluaran: number;
    breakdownPerKategori: Array<{
      kategoriId: string;
      namaKategori: string;
      nominal: number;
      persentase: number;
    }>;
  };
  surplusDefisitOperasional: number;
  totalKewajibanTabungan: number;
}

interface SantriSavingsItem {
  santriId: string;
  nis: string;
  nama: string;
  komplek: string;
  kategori: string;
  status: string;
  saldoTabungan: number;
}

interface Props {
  initialReport: FinancialSummaryData;
  initialSavingsList: SantriSavingsItem[];
  complexList: ComplexItem[];
  defaultStartDate: string;
  defaultEndDate: string;
}

export function BendaharaReportsClient({
  initialReport,
  initialSavingsList,
  complexList,
  defaultStartDate,
  defaultEndDate,
}: Props) {
  const [report, setReport] = useState<FinancialSummaryData>(initialReport);
  const [savingsList, setSavingsList] = useState<SantriSavingsItem[]>(initialSavingsList);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [selectedKomplek, setSelectedKomplek] = useState('all');
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'tabungan'>('ringkasan');
  const [loading, setLoading] = useState(false);

  const handleApplyFilter = async () => {
    setLoading(true);
    try {
      const komplekId = selectedKomplek === 'all' ? undefined : selectedKomplek;
      const [resSummary, resSavings] = await Promise.all([
        getFinancialSummaryAction({ startDate, endDate, komplekId }),
        getSantriSavingsReportAction({ komplekId }),
      ]);

      if (resSummary.success && resSummary.data) {
        setReport(resSummary.data);
      }
      if (resSavings.success && resSavings.data) {
        setSavingsList(resSavings.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan
    const summaryData = [
      ['LAPORAN KEUANGAN PONDOK PESANTREN'],
      [`Periode: ${startDate} s/d ${endDate}`],
      [`Komplek: ${selectedKomplek === 'all' ? 'Semua Komplek' : complexList.find(c => c.id === selectedKomplek)?.nama}`],
      [],
      ['1. PEMASUKAN'],
      ['Total Pemasukan', report.pemasukan.totalPemasukan],
      ['Alokasi Tabungan Santri (Kewajiban)', report.pemasukan.alokasiTabungan],
      ['Alokasi Operasional Komplek', report.pemasukan.alokasiOperasional],
      [],
      ['2. PENGELUARAN'],
      ['Total Pengeluaran', report.pengeluaran.totalPengeluaran],
      ...report.pengeluaran.breakdownPerKategori.map(b => [`- ${b.namaKategori}`, b.nominal, `${b.persentase}%`]),
      [],
      ['3. HASIL BERSIH'],
      ['Surplus / Defisit Operasional', report.surplusDefisitOperasional],
      ['Total Saldo Tabungan Tersimpan', report.totalKewajibanTabungan],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Keuangan');

    // Sheet 2: Tabungan Santri
    const savingsData = [
      ['NIS', 'Nama Santri', 'Komplek', 'Kategori', 'Status', 'Saldo Tabungan'],
      ...savingsList.map(s => [
        s.nis,
        s.nama,
        s.komplek,
        s.kategori,
        s.status,
        s.saldoTabungan
      ])
    ];
    const wsSavings = XLSX.utils.aoa_to_sheet(savingsData);
    XLSX.utils.book_append_sheet(wb, wsSavings, 'Buku Tabungan Santri');

    XLSX.writeFile(wb, `Laporan_Keuangan_Ponpes_${startDate}_sd_${endDate}.xlsx`);
  };

  // Export to PDF (.pdf)
  const handleExportPdf = () => {
    const doc = new jsPDF();

    // Header Kop
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SISTEM MANAJEMEN KEUANGAN PONDOK PESANTREN', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode Laporan: ${startDate} s/d ${endDate}`, 14, 28);
    const komplekNama = selectedKomplek === 'all' ? 'Semua Komplek' : complexList.find(c => c.id === selectedKomplek)?.nama || '-';
    doc.text(`Lingkup Komplek: ${komplekNama}`, 14, 34);

    // Tabel Ringkasan
    autoTable(doc, {
      startY: 42,
      head: [['Indikator Keuangan', 'Nominal (Rp)', 'Keterangan']],
      body: [
        ['Total Pemasukan Terverifikasi', report.pemasukan.totalPemasukan.toLocaleString('id-ID'), 'Semua pembayaran diterima'],
        ['Alokasi Operasional Komplek', report.pemasukan.alokasiOperasional.toLocaleString('id-ID'), 'Dana operasional ponpes'],
        ['Alokasi Tabungan Santri', report.pemasukan.alokasiTabungan.toLocaleString('id-ID'), 'Titipan tabungan santri'],
        ['Total Pengeluaran Aktif', report.pengeluaran.totalPengeluaran.toLocaleString('id-ID'), 'Realisasi belanja operasional'],
        [
          'Surplus / Defisit Operasional',
          report.surplusDefisitOperasional.toLocaleString('id-ID'),
          report.surplusDefisitOperasional >= 0 ? 'Surplus Operasional' : 'Defisit Operasional'
        ],
        ['Total Saldo Tabungan Seluruh Santri', report.totalKewajibanTabungan.toLocaleString('id-ID'), 'Kewajiban saldo di pondok'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 81, 50] },
    });

    // Tabel Rincian Pengeluaran per Kategori
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Rincian Realisasi Pengeluaran per Kategori', 14, finalY + 12);

    autoTable(doc, {
      startY: finalY + 16,
      head: [['Kategori Pengeluaran', 'Nominal (Rp)', 'Porsi (%)']],
      body: report.pengeluaran.breakdownPerKategori.map(b => [
        b.namaKategori,
        b.nominal.toLocaleString('id-ID'),
        `${b.persentase}%`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139] },
    });

    doc.save(`Laporan_Keuangan_Ponpes_${startDate}_sd_${endDate}.pdf`);
  };

  // Bagikan ke WA
  const handleShareWa = () => {
    const komplekNama = selectedKomplek === 'all' ? 'Semua Komplek' : complexList.find(c => c.id === selectedKomplek)?.nama;
    const text =
      `*REKAP KEUANGAN PONDOK PESANTREN*\n` +
      `Periode: ${startDate} s/d ${endDate}\n` +
      `Komplek: ${komplekNama}\n\n` +
      `• *Total Pemasukan:* Rp ${report.pemasukan.totalPemasukan.toLocaleString('id-ID')}\n` +
      `  - Alokasi Operasional: Rp ${report.pemasukan.alokasiOperasional.toLocaleString('id-ID')}\n` +
      `  - Alokasi Tabungan: Rp ${report.pemasukan.alokasiTabungan.toLocaleString('id-ID')}\n\n` +
      `• *Total Pengeluaran:* Rp ${report.pengeluaran.totalPengeluaran.toLocaleString('id-ID')}\n` +
      `• *Hasil Bersih:* Rp ${report.surplusDefisitOperasional.toLocaleString('id-ID')} (${report.surplusDefisitOperasional >= 0 ? 'Surplus' : 'Defisit'})\n` +
      `• *Total Saldo Tabungan Santri:* Rp ${report.totalKewajibanTabungan.toLocaleString('id-ID')}\n\n` +
      `_Laporan diekspor dari Sistem Keuangan Ponpes_`;

    navigator.clipboard.writeText(text);
    alert('Teks rekap laporan berhasil disalin ke clipboard! Silakan paste langsung di grup WhatsApp.');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111] tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-[#757575]">Rekap pemasukan, pengeluaran, alokasi tabungan, dan ekspor resmi</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleShareWa}
            className="px-3.5 py-2 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-xs sm:text-sm font-semibold text-[#111111] hover:bg-[#f6f5f4] transition flex items-center gap-1.5 bg-white shadow-none"
          >
            <span>📱 Bagikan ke WA</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 border border-[rgba(0,117,222,0.2)] bg-[#e6f3fe] hover:bg-[#e6f3fe]/80 text-[#0075de] rounded-[8px] text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 shadow-none"
          >
            <span>📊 Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-2 bg-[#0075de] hover:bg-[#0060b8] text-white rounded-[8px] text-xs sm:text-sm font-semibold shadow-none transition flex items-center gap-1.5"
          >
            <span>📄 Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-4 shadow-none flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-[#757575] block mb-1 font-semibold">Tanggal Mulai</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white text-[#111111] shadow-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#757575] block mb-1 font-semibold">Tanggal Akhir</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white text-[#111111] shadow-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#757575] block mb-1 font-semibold">Komplek</label>
          <select
            value={selectedKomplek}
            onChange={(e) => setSelectedKomplek(e.target.value)}
            className="px-3 py-1.5 border border-[rgba(0,0,0,0.12)] rounded-[8px] text-sm bg-white text-[#111111] shadow-none"
          >
            <option value="all">Semua Komplek</option>
            {complexList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleApplyFilter}
          disabled={loading}
          className="px-4 py-2 bg-[#0075de] text-white rounded-[8px] text-sm font-semibold hover:bg-[#0060b8] transition disabled:opacity-50 shadow-none"
        >
          {loading ? 'Memuat...' : 'Terapkan Filter'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(0,0,0,0.08)] gap-4">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'ringkasan'
              ? 'border-[#0075de] text-[#0075de]'
              : 'border-transparent text-[#757575] hover:text-[#111111]'
          }`}
        >
          Ringkasan Arus Kas &amp; Alokasi
        </button>
        <button
          onClick={() => setActiveTab('tabungan')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'tabungan'
              ? 'border-[#0075de] text-[#0075de]'
              : 'border-transparent text-[#757575] hover:text-[#111111]'
          }`}
        >
          Rekap Saldo Tabungan Santri ({savingsList.length})
        </button>
      </div>

      {/* Content Tab 1: Ringkasan */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
              <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider">Total Pemasukan</p>
              <p className="text-2xl font-bold text-[#111111] mt-1 font-mono">
                <CurrencyDisplay amount={report.pemasukan.totalPemasukan} />
              </p>
              <div className="text-xs text-[#757575] mt-2 space-y-0.5 border-t border-[rgba(0,0,0,0.08)] pt-2">
                <div className="flex justify-between">
                  <span>Operasional:</span>
                  <span className="font-mono font-medium">Rp {report.pemasukan.alokasiOperasional.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tabungan:</span>
                  <span className="font-mono font-medium">Rp {report.pemasukan.alokasiTabungan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
              <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-[#e32d14] mt-1 font-mono">
                <CurrencyDisplay amount={report.pengeluaran.totalPengeluaran} />
              </p>
              <p className="text-xs text-[#757575] mt-2 border-t border-[rgba(0,0,0,0.08)] pt-2">
                Realisasi belanja operasional
              </p>
            </div>

            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
              <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider">Surplus / Defisit Operasional</p>
              <p className={`text-2xl font-bold mt-1 font-mono ${report.surplusDefisitOperasional >= 0 ? 'text-[#0075de]' : 'text-[#e32d14]'}`}>
                <CurrencyDisplay amount={report.surplusDefisitOperasional} showSign />
              </p>
              <p className="text-xs text-[#757575] mt-2 border-t border-[rgba(0,0,0,0.08)] pt-2">
                Alokasi operasional - pengeluaran
              </p>
            </div>

            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-5 shadow-none">
              <p className="text-xs font-semibold text-[#757575] uppercase tracking-wider">Kewajiban Tabungan Santri</p>
              <p className="text-2xl font-bold text-[#b47800] mt-1 font-mono">
                <CurrencyDisplay amount={report.totalKewajibanTabungan} />
              </p>
              <p className="text-xs text-[#757575] mt-2 border-t border-[rgba(0,0,0,0.08)] pt-2">
                Total saldo tabungan seluruh santri
              </p>
            </div>
          </div>

          {/* Breakdown Pengeluaran */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-6 shadow-none">
            <h3 className="text-base font-bold text-[#111111] mb-4">Breakdown Pengeluaran per Kategori</h3>
            {report.pengeluaran.breakdownPerKategori.length === 0 ? (
              <p className="text-sm text-[#757575] py-4">Belum ada pengeluaran pada periode ini</p>
            ) : (
              <div className="space-y-4">
                {report.pengeluaran.breakdownPerKategori.map((b) => (
                  <div key={b.kategoriId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-[#111111]">{b.namaKategori}</span>
                      <span className="font-mono font-semibold text-[#111111]">
                        Rp {b.nominal.toLocaleString('id-ID')} ({b.persentase}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#f6f5f4] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0075de] h-2.5 rounded-full"
                        style={{ width: `${Math.min(b.persentase, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Tab 2: Rekap Saldo Tabungan */}
      {activeTab === 'tabungan' && (
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#f6f5f4] border-b border-[rgba(0,0,0,0.08)] text-[rgba(0,0,0,0.6)] text-xs font-medium uppercase tracking-wider">
                  <th className="px-5 py-3.5">NIS</th>
                  <th className="px-5 py-3.5">Nama Santri</th>
                  <th className="px-5 py-3.5">Komplek</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Saldo Tabungan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
                {savingsList.map((s) => (
                  <tr key={s.santriId} className="hover:bg-[#f6f5f4]/80 transition">
                    <td className="px-5 py-3.5 font-mono text-[#111111]">{s.nis}</td>
                    <td className="px-5 py-3.5 font-medium text-[#111111]">{s.nama}</td>
                    <td className="px-5 py-3.5 text-[#757575]">{s.komplek}</td>
                    <td className="px-5 py-3.5 text-[#757575]">{s.kategori}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        s.status === 'aktif' ? 'bg-[#ebf5ee] text-[#2b6e4f]' : 'bg-[#f6f5f4] text-[#757575]'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-[#111111]">
                      <CurrencyDisplay amount={s.saldoTabungan} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
