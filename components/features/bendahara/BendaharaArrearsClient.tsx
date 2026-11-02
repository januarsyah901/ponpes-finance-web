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
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Daftar Penunggak & Pengingat WA</h1>
          <p className="text-sm text-[#64748B]">Pantau santri yang menunggak syahriah dan kirim tagihan instan via WhatsApp</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Santri Menunggak</p>
          <p className="text-2xl font-bold text-[#DC2626] mt-1 font-mono">{arrearsList.length}</p>
          <p className="text-xs text-[#64748B] mt-1">Tunggakan &gt;= {minMonths} bulan</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Nominal Tertunggak</p>
          <p className="text-2xl font-bold text-[#DC2626] mt-1 font-mono">
            <CurrencyDisplay amount={totalNominalTunggakan} />
          </p>
          <p className="text-xs text-[#64748B] mt-1">Akumulasi sisa tagihan</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Sudah Diingatkan Bulan Ini</p>
          <p className="text-2xl font-bold text-[#0F5132] mt-1 font-mono">
            {arrearsList.filter((a) => a.terakhirDiingatkan !== null).length}
          </p>
          <p className="text-xs text-[#64748B] mt-1">Tercatat di audit log</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-[#64748B] block mb-1 font-semibold">Filter Komplek</label>
          <select
            value={selectedKomplek}
            onChange={(e) => setSelectedKomplek(e.target.value)}
            className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 text-[#0F172A]"
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
          <label className="text-xs text-[#64748B] block mb-1 font-semibold">Minimal Bulan Menunggak</label>
          <select
            value={minMonths}
            onChange={(e) => setMinMonths(Number(e.target.value))}
            className="px-3 py-1.5 border border-[#E2E8F0] rounded-xl text-sm bg-slate-50 text-[#0F172A]"
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
          className="px-4 py-2 bg-[#0F5132] text-white rounded-xl text-sm font-semibold hover:bg-[#0c3e27] transition disabled:opacity-50"
        >
          {loading ? 'Memuat...' : 'Filter'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                <th className="px-5 py-3.5">Santri</th>
                <th className="px-5 py-3.5">Komplek / Kategori</th>
                <th className="px-5 py-3.5 text-center">Bulan Tertunggak</th>
                <th className="px-5 py-3.5 text-right">Total Tunggakan</th>
                <th className="px-5 py-3.5 text-center">Status Pengingat</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {arrearsList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#64748B]">
                    Alhamdulillah, tidak ada santri dengan tunggakan &gt;= {minMonths} bulan.
                  </td>
                </tr>
              ) : (
                arrearsList.map((item) => (
                  <tr key={item.santriId} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#0F172A]">{item.nama}</div>
                      <div className="text-xs text-[#64748B] font-mono">NIS: {item.nis}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-[#0F172A] text-xs font-medium">{item.komplekNama}</div>
                      <div className="text-xs text-[#64748B]">{item.kategoriNama}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.jumlahBulanTertunggak >= 3
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.jumlahBulanTertunggak} Bulan
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-mono font-bold text-[#DC2626]">
                      <CurrencyDisplay amount={item.totalTunggakan} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {item.terakhirDiingatkan ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#0F5132] border border-emerald-200">
                            Sudah Diingatkan
                          </span>
                          <span className="text-[10px] text-[#64748B] mt-0.5">
                            {formatTanggalIndo(new Date(item.terakhirDiingatkan).toISOString().split('T')[0])}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                          Belum Diingatkan
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewSantri(item)}
                          className="px-2.5 py-1.5 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition"
                        >
                          Rincian
                        </button>
                        <button
                          onClick={() => handleSendWa(item)}
                          className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E2E8F0]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Rincian Tunggakan</h2>
                <p className="text-xs text-[#64748B]">
                  {previewSantri.nama} (NIS: {previewSantri.nis}) - {previewSantri.komplekNama}
                </p>
              </div>
              <button
                onClick={() => setPreviewSantri(null)}
                className="text-[#64748B] hover:text-[#0F172A] text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="border border-[#E2E8F0] rounded-xl p-3 bg-slate-50 text-xs space-y-2">
                <div className="font-semibold text-[#0F172A]">Daftar Tagihan Belum Lunas:</div>
                {previewSantri.daftarTagihan.map((t) => (
                  <div key={t.id} className="flex justify-between border-b border-slate-200 pb-1">
                    <span>{t.judul}</span>
                    <span className="font-mono font-medium text-[#DC2626]">
                      Rp {t.sisa.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 font-bold text-[#0F172A]">
                  <span>Total Tagihan:</span>
                  <span className="font-mono text-[#DC2626]">
                    Rp {previewSantri.totalTunggakan.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#64748B] mb-1">Nomor WhatsApp:</div>
                <div className="font-mono text-sm text-[#0F172A] bg-slate-100 px-3 py-1.5 rounded-lg">
                  {previewSantri.nomorWhatsapp}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPreviewSantri(null)}
                  className="px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B]"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    handleSendWa(previewSantri);
                    setPreviewSantri(null);
                  }}
                  className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
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
