'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { formatDateIndo } from '@/lib/formatters';
import { ProofInspectionModal } from './ProofInspectionModal';
import {
  Clock,
  CheckCircle,
  Search,
  Eye,
  CheckCheck,
} from 'lucide-react';

interface VerificationQueueClientProps {
  initialQueue: any[];
  complexList: any[];
  metrics: {
    pendingCount: number;
    pendingTotal: number;
    todayVerifiedCount: number;
  };
}

export function VerificationQueueClient({
  initialQueue,
  complexList,
  metrics,
}: VerificationQueueClientProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKomplekId, setSelectedKomplekId] = useState<string>('all');
  const [inspectingPayment, setInspectingPayment] = useState<any | null>(null);

  // Filter logic
  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.santriNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.santriNis.includes(searchQuery);

    const matchesKomplek =
      selectedKomplekId === 'all' || item.komplekId === selectedKomplekId;

    return matchesSearch && matchesKomplek;
  });

  const handleModalSuccess = (paymentId: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== paymentId));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-[#0F172A]">
          Antrean Verifikasi Pembayaran
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Periksa bukti transfer santri, cocokkan mutasi bank, dan setujui alokasi otomatis
        </p>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Count Card */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Menunggu Verifikasi
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-amber-600">
              {queue.length} Transaksi
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              Total nominal: <CurrencyDisplay amount={metrics.pendingTotal} className="font-semibold text-[#0F172A]" />
            </div>
          </CardContent>
        </Card>

        {/* Verified Today Card */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Terverifikasi Hari Ini
            </CardTitle>
            <CheckCheck className="h-4 w-4 text-[#10B981]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading text-[#0F5132]">
              {metrics.todayVerifiedCount} Pembayaran
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              Alokasi tabungan & operasional berjalan otomatis
            </div>
          </CardContent>
        </Card>

        {/* Quick Help Card */}
        <Card className="border-[#E2E8F0] bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              Petunjuk Bendahara
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-[#0F5132]" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-[#64748B] leading-relaxed">
              Klik <strong>&ldquo;Periksa Bukti&rdquo;</strong> untuk zoom/pan foto struk transfer dan memilih Setujui, Koreksi, atau Tolak.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
              <Input
                placeholder="Cari nama santri atau NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Complex Filter */}
            <div className="w-full sm:w-60">
              <select
                value={selectedKomplekId}
                onChange={(e) => setSelectedKomplekId(e.target.value)}
                aria-label="Filter berdasarkan komplek"
                className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              >
                <option value="all">Semua Komplek</option>
                {complexList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.kode} - {c.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card className="border-[#E2E8F0] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] font-semibold">
                <th className="py-3 px-4">Tanggal Bayar</th>
                <th className="py-3 px-4">Santri</th>
                <th className="py-3 px-4">Komplek / Kategori</th>
                <th className="py-3 px-4">Nominal Pengajuan</th>
                <th className="py-3 px-4">Catatan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B]">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-[#10B981]" />
                      <p className="font-semibold text-[#0F172A]">Tidak ada antrean pembayaran</p>
                      <p className="text-xs">Semua bukti transfer santri telah diverifikasi</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#0F172A] whitespace-nowrap">
                      {formatDateIndo(item.tanggalBayar)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#0F172A]">{item.santriNama}</div>
                      <div className="font-mono text-[11px] text-[#64748B]">{item.santriNis}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-[#0F172A]">{item.komplekNama}</div>
                      <div className="text-[11px] text-[#64748B]">{item.kategoriNama}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CurrencyDisplay amount={item.nominal} className="font-bold text-[#0F5132]" />
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#64748B]">
                      {item.catatanSantri || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        onClick={() => setInspectingPayment(item)}
                        className="bg-[#0F5132] hover:bg-[#0F5132]/90 text-white font-semibold text-xs h-8 gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Periksa Bukti</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Proof Inspection Modal */}
      {inspectingPayment && (
        <ProofInspectionModal
          payment={inspectingPayment}
          isOpen={!!inspectingPayment}
          onClose={() => setInspectingPayment(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
