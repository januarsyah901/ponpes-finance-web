'use client';

import React, { useState } from 'react';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { formatTanggalIndo } from '@/lib/formatters';
import { getArrearsDashboardAction, markWaReminderSentAction } from '@/actions/arrears.actions';

interface SantriArrearsItem {
  santriId: string;
  nis: string;
  nama: string;
  komplekNama: string;
  kategoriNama: string;
  nomorWhatsapp: string;
  terakhirDiingatkan: Date | null;
  totalTunggakan: number;
  jumlahBulanTertunggak: number;
  daftarTagihan: Array<{
    id: string;
    judul: string;
    bulan: number | null;
    tahun: number | null;
    nominal: number;
    sisa: number;
    jatuhTempo: string;
  }>;
  waLink: string;
}

interface ComplexItem {
  id: string;
  nama: string;
}

interface Props {
  initialArrears: SantriArrearsItem[];
  complexList: ComplexItem[];
}

export function BendaharaArrearsClient({
  initialArrears,
  complexList,
}: Props) {
  const [arrearsList, setArrearsList] = useState<SantriArrearsItem[]>(initialArrears);
  const [selectedKomplek, setSelectedKomplek] = useState('all');
  const [minMonths, setMinMonths] = useState(2);
  const [loading, setLoading] = useState(false);
  const [previewSantri, setPreviewSantri] = useState<SantriArrearsItem | null>(null);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const komplekId = selectedKomplek === 'all' ? undefined : selectedKomplek;
      const res = await getArrearsDashboardAction({ komplekId, minMonths });
      if (res.success && res.data) {
        setArrearsList(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendWa = async (santri: SantriArrearsItem) => {
    // 1. Open WhatsApp in new tab
    window.open(santri.waLink, '_blank');

    // 2. Mark reminder sent in background
    try {
      await markWaReminderSentAction(santri.santriId);
      setArrearsList(
        arrearsList.map((item) =>
          item.santriId === santri.santriId
            ? { ...item, terakhirDiingatkan: new Date() }
            : item
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const totalNominalTunggakan = arrearsList.reduce(
    (sum, item) => sum + Number(item.totalTunggakan),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#202119] tracking-tight">Daftar Penunggak &amp; Pengingat WA</h1>
          <p className="text-sm text-[#626262]">Pantau santri yang menunggak syahriah dan kirim tagihan instan via WhatsApp</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E8E8] rounded-[18px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#626262] uppercase tracking-wider">Total Santri Menunggak</p>
          <p className="text-2xl font-bold text-[#C84C5A] mt-1 font-sans tabular-nums lining-nums">{arrearsList.length}</p>
          <p className="text-xs text-[#626262] mt-1">Tunggakan &gt;= {minMonths} bulan</p>
        </div>

        <div className="bg-white border border-[#E8E8E8] rounded-[18px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#626262] uppercase tracking-wider">Total Nominal Tertunggak</p>
          <p className="text-2xl font-bold text-[#C84C5A] mt-1 font-sans tabular-nums lining-nums">
            <CurrencyDisplay amount={totalNominalTunggakan} />
          </p>
          <p className="text-xs text-[#626262] mt-1">Akumulasi sisa tagihan</p>
        </div>

        <div className="bg-white border border-[#E8E8E8] rounded-[18px] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-[#626262] uppercase tracking-wider">Sudah Diingatkan Bulan Ini</p>
          <p className="text-2xl font-bold text-[#202119] mt-1 font-sans tabular-nums lining-nums">
            {arrearsList.filter((a) => a.terakhirDiingatkan !== null).length}
          </p>
          <p className="text-xs text-[#626262] mt-1">Tercatat di audit log</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E8E8E8] rounded-[18px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-[#626262] block mb-1 font-semibold">Filter Komplek</label>
          <select
            value={selectedKomplek}
            onChange={(e) => setSelectedKomplek(e.target.value)}
            className="px-3 py-1.5 border border-[#E8E8E8] rounded-[8px] text-sm bg-white text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4] shadow-none"
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
          <label className="text-xs text-[#626262] block mb-1 font-semibold">Minimal Bulan Menunggak</label>
          <select
            value={minMonths}
            onChange={(e) => setMinMonths(Number(e.target.value))}
            className="px-3 py-1.5 border border-[#E8E8E8] rounded-[8px] text-sm bg-white text-[#202119] focus:outline-none focus:ring-1 focus:ring-[#315FC4] shadow-none"
          >
            <option value={1}>Minimal 1 Bulan</option>
            <option value={2}>Minimal 2 Bulan (Default PRD)</option>
            <option value={3}>Minimal 3 Bulan</option>
            <option value={4}>Minimal 4 Bulan</option>
          </select>
        </div>

        <button
          onClick={handleFilter}
          disabled={loading}
          className="px-4 py-2 bg-[#202119] text-white rounded-[8px] text-sm font-semibold hover:bg-[#2e2f26] transition disabled:opacity-50 shadow-none"
        >
          {loading ? 'Memuat...' : 'Filter'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8E8E8] rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F5F5F5] border-b border-[#E8E8E8] text-[#626262] text-xs font-medium uppercase tracking-wider">
                <th className="px-5 py-3.5">Santri</th>
                <th className="px-5 py-3.5">Komplek / Kategori</th>
                <th className="px-5 py-3.5 text-center">Bulan Tertunggak</th>
                <th className="px-5 py-3.5 text-right">Total Tunggakan</th>
                <th className="px-5 py-3.5 text-center">Status Pengingat</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E8]">
              {arrearsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#626262]">
                    Alhamdulillah, tidak ada santri dengan tunggakan &gt;= {minMonths} bulan.
                  </td>
                </tr>
              ) : (
                arrearsList.map((item) => (
                  <tr key={item.santriId} className="hover:bg-[#F5F5F5] transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#202119]">{item.nama}</div>
                      <div className="text-xs text-[#626262] font-mono">NIS: {item.nis}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-[#202119] text-xs font-medium">{item.komplekNama}</div>
                      <div className="text-xs text-[#626262]">{item.kategoriNama}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.jumlahBulanTertunggak >= 3
                          ? 'bg-[#FCEDEF] text-[#C84C5A] border border-[rgba(200,76,90,0.2)]'
                          : 'bg-[#FFF7ED] text-[#C2410C] border border-[rgba(194,65,12,0.2)]'
                      }`}>
                        {item.jumlahBulanTertunggak} Bulan
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-sans tabular-nums lining-nums font-bold text-[#C84C5A]">
                      <CurrencyDisplay amount={item.totalTunggakan} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {item.terakhirDiingatkan ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF7EF] text-[#2B8A60] border border-[rgba(43,138,96,0.2)]">
                            Sudah Diingatkan
                          </span>
                          <span className="text-[10px] text-[#626262] mt-0.5 font-sans">
                            {formatTanggalIndo(new Date(item.terakhirDiingatkan).toISOString().split('T')[0])}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F5F5F5] text-[#747474] border border-[#E8E8E8]">
                          Belum Diingatkan
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewSantri(item)}
                          className="px-2.5 py-1.5 border border-[#E8E8E8] rounded-[8px] text-xs font-semibold text-[#202119] hover:bg-[#F5F5F5] transition bg-white shadow-none"
                        >
                          Rincian
                        </button>
                        <button
                          onClick={() => handleSendWa(item)}
                          className="px-3 py-1.5 bg-[#202119] hover:bg-[#2e2f26] text-white rounded-[8px] text-xs font-bold transition flex items-center gap-1 shadow-none"
                          title="Buka pesan siap kirim di WhatsApp"
                        >
                          <span>Kirim WA</span>
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

      {/* Modal Rincian & Preview Pesan */}
      {previewSantri && (
        <div className="fixed inset-0 z-50 bg-[#202119]/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] max-w-lg w-full p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-[#E8E8E8]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#202119]">Rincian Tunggakan</h2>
                <p className="text-xs text-[#626262]">
                  {previewSantri.nama} (NIS: {previewSantri.nis}) - {previewSantri.komplekNama}
                </p>
              </div>
              <button
                onClick={() => setPreviewSantri(null)}
                className="text-[#626262] hover:text-[#202119] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="border border-[#E8E8E8] rounded-[8px] p-3 bg-[#F6F6F6] text-xs space-y-2">
                <div className="font-semibold text-[#202119]">Daftar Tagihan Belum Lunas:</div>
                {previewSantri.daftarTagihan.map((t) => (
                  <div key={t.id} className="flex justify-between border-b border-[#E8E8E8] pb-1">
                    <span className="text-[#202119]">{t.judul}</span>
                    <span className="font-sans tabular-nums lining-nums font-medium text-[#C84C5A]">
                      Rp {t.sisa.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 font-bold text-[#202119]">
                  <span>Total Tagihan:</span>
                  <span className="font-sans tabular-nums lining-nums text-[#C84C5A]">
                    Rp {previewSantri.totalTunggakan.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#626262] mb-1">Nomor WhatsApp:</div>
                <div className="font-mono text-sm text-[#202119] bg-[#F5F5F5] border border-[#E8E8E8] px-3 py-1.5 rounded-[8px]">
                  {previewSantri.nomorWhatsapp}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPreviewSantri(null)}
                  className="px-4 py-2 border border-[#E8E8E8] rounded-[8px] text-xs font-semibold text-[#626262] hover:bg-[#F5F5F5] shadow-none"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    handleSendWa(previewSantri);
                    setPreviewSantri(null);
                  }}
                  className="px-4 py-2 bg-[#202119] hover:bg-[#2e2f26] text-white rounded-[8px] text-xs font-bold transition flex items-center gap-1.5 shadow-none"
                >
                  <span>Buka WhatsApp Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
