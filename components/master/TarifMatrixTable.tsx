'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { formatDateIndo, formatRupiah } from '@/lib/formatters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Grid3X3, Edit3, ShieldAlert, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { updateTarifAction } from '@/actions/tarif.actions';

interface Komplek {
  id: string;
  kode: string;
  nama: string;
  jenis: string;
}

interface Kategori {
  id: string;
  kode: string;
  nama: string;
}

interface TarifRecord {
  id: string;
  komplekId: string;
  kategoriId: string;
  nominal: number;
  alokasiTabungan: number;
  alokasiOperasional: number;
  berlakuMulai: string;
  berlakuSampai: string | null;
  isActive: boolean;
}

interface TarifMatrixProps {
  complexes: Komplek[];
  categories: Kategori[];
  rates: TarifRecord[];
}

export function TarifMatrixTable({ complexes, categories, rates }: TarifMatrixProps) {
  const router = useRouter();

  // Dialog state
  const [selectedCell, setSelectedCell] = useState<{
    komplek: Komplek;
    kategori: Kategori;
    currentRate?: TarifRecord;
  } | null>(null);

  const [nominalInput, setNominalInput] = useState<number>(350000);
  const [berlakuMulai, setBerlakuMulai] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getRateFor = (komplekId: string, kategoriId: string) => {
    return rates.find((r) => r.komplekId === komplekId && r.kategoriId === kategoriId);
  };

  const handleOpenEdit = (komplek: Komplek, kategori: Kategori) => {
    const current = getRateFor(komplek.id, kategori.id);
    setSelectedCell({ komplek, kategori, currentRate: current });
    setNominalInput(current?.nominal || 350000);
    setBerlakuMulai(new Date().toISOString().split('T')[0]);
    setFormError(null);
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell) return;
    setIsSubmitting(true);
    setFormError(null);

    const res = await updateTarifAction({
      komplekId: selectedCell.komplek.id,
      kategoriId: selectedCell.kategori.id,
      nominal: nominalInput,
      berlakuMulai,
    });

    if (!res.success) {
      setFormError(res.error || 'Gagal memperbarui tarif');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setSelectedCell(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Matrix Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider w-56 border-r border-[#E2E8F0]">
                Komplek Asrama
              </th>
              {categories.map((c) => (
                <th key={c.id} className="p-4 text-xs font-bold text-[#475569] uppercase tracking-wider border-r border-[#E2E8F0] last:border-r-0">
                  <div className="font-semibold text-[#0F172A]">{c.nama}</div>
                  <div className="text-[10px] text-[#94A3B8] font-mono normal-case">kode: {c.kode}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {complexes.map((k) => (
              <tr key={k.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                <td className="p-4 border-r border-[#E2E8F0] bg-[#FAFAFA]/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-[#EBF5F0] text-[#0F5132] px-2 py-0.5 rounded">
                      {k.kode}
                    </span>
                    <span className="text-xs font-semibold text-[#0F172A]">{k.nama}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B] capitalize mt-0.5">{k.jenis}</div>
                </td>

                {categories.map((c) => {
                  const rate = getRateFor(k.id, c.id);
                  return (
                    <td key={c.id} className="p-4 border-r border-[#E2E8F0] last:border-r-0 align-top">
                      {rate ? (
                        <div className="space-y-2">
                          <div>
                            <CurrencyDisplay
                              amount={rate.nominal}
                              className="text-base font-bold text-[#0F172A]"
                            />
                            <div className="text-[11px] text-[#64748B] mt-0.5 space-y-0.5">
                              <div>• Tabungan: <span className="font-mono text-[#0F5132] font-semibold">{formatRupiah(rate.alokasiTabungan)}</span></div>
                              <div>• Ops Komplek: <span className="font-mono text-[#334155]">{formatRupiah(rate.alokasiOperasional)}</span></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                            <span className="text-[10px] text-[#94A3B8]">
                              Sejak {formatDateIndo(rate.berlakuMulai)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(k, c)}
                              className="h-7 px-2 text-xs text-[#0F5132] hover:bg-[#EBF5F0]"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Ubah
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#94A3B8] italic flex items-center justify-between">
                          <span>Belum diatur</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(k, c)}
                            className="h-7 px-2 text-xs text-[#0F5132]"
                          >
                            + Atur
                          </Button>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Tarif Modal Dialog */}
      {selectedCell && (
        <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ubah Tarif Syahriah</DialogTitle>
              <DialogDescription>
                Mengubah tarif untuk <strong>{selectedCell.komplek.nama} ({selectedCell.komplek.kode})</strong> pada kategori <strong>{selectedCell.kategori.nama}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitUpdate} className="space-y-4">
              {formError && (
                <Alert variant="destructive" className="py-2.5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="nominal" className="text-xs font-semibold">Nominal Total Syahriah (Rp)</Label>
                <Input
                  id="nominal"
                  type="number"
                  min={50000}
                  step={5000}
                  required
                  value={nominalInput}
                  onChange={(e) => setNominalInput(Number(e.target.value))}
                  className="font-mono text-base font-bold text-[#0F172A]"
                />
                <p className="text-[11px] text-[#64748B]">Minimal Rp50.000 untuk alokasi tabungan tetap.</p>
              </div>

              {/* Automatic Split Preview */}
              <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-2">
                <div className="text-xs font-semibold text-[#0F172A]">Simulasi Alokasi Otomatis:</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Alokasi Tabungan (Tetap):</span>
                  <span className="font-mono font-semibold text-[#0F5132]">Rp 50.000</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E2E8F0]">
                  <span className="text-[#64748B]">Alokasi Operasional Komplek:</span>
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {formatRupiah(Math.max(0, nominalInput - 50000))}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="berlakuMulai" className="text-xs font-semibold">Berlaku Mulai Tanggal</Label>
                <Input
                  id="berlakuMulai"
                  type="date"
                  required
                  value={berlakuMulai}
                  onChange={(e) => setBerlakuMulai(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-[#64748B]">
                  Tarif lama akan dinonaktifkan dengan tanggal berlaku sampai tanggal ini. Riwayat tagihan masa lalu tidak akan terpengaruh.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCell(null)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-[#0F5132] hover:bg-[#0B3D26] text-white">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Tarif Baru'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
