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
      <div className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white overflow-x-auto shadow-none">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f6f5f4] border-b border-[rgba(0,0,0,0.08)]">
              <th className="p-4 text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider w-56 border-r border-[rgba(0,0,0,0.08)]">
                Komplek Asrama
              </th>
              {categories.map((c) => (
                <th key={c.id} className="p-4 text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider border-r border-[rgba(0,0,0,0.08)] last:border-r-0">
                  <div className="font-semibold text-[#111111]">{c.nama}</div>
                  <div className="text-[10px] text-[#757575] font-mono normal-case">kode: {c.kode}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.08)]">
            {complexes.map((k) => (
              <tr key={k.id} className="hover:bg-[rgba(55,53,47,0.02)] transition-colors">
                <td className="p-4 border-r border-[rgba(0,0,0,0.08)] bg-[#fbfbfa]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-xs bg-[#e6f3fe] text-[#0075de] px-2 py-0.5 rounded-[6px]">
                      {k.kode}
                    </span>
                    <span className="text-xs font-semibold text-[#111111]">{k.nama}</span>
                  </div>
                  <div className="text-[11px] text-[#757575] capitalize mt-0.5">{k.jenis}</div>
                </td>

                {categories.map((c) => {
                  const rate = getRateFor(k.id, c.id);
                  return (
                    <td key={c.id} className="p-4 border-r border-[rgba(0,0,0,0.08)] last:border-r-0 align-top">
                      {rate ? (
                        <div className="space-y-2">
                          <div>
                            <CurrencyDisplay
                              amount={rate.nominal}
                              className="text-base font-bold text-[#111111]"
                            />
                            <div className="text-[11px] text-[#757575] mt-0.5 space-y-0.5">
                              <div>• Tabungan: <span className="font-mono text-[#2b6e4f] font-semibold">{formatRupiah(rate.alokasiTabungan)}</span></div>
                              <div>• Ops Komplek: <span className="font-mono text-[#111111]">{formatRupiah(rate.alokasiOperasional)}</span></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,0,0,0.04)]">
                            <span className="text-[10px] text-[#757575]">
                              Sejak {formatDateIndo(rate.berlakuMulai)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(k, c)}
                              className="h-7 px-2 text-xs text-[#0075de] hover:bg-[#e6f3fe] rounded-[6px]"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Ubah
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#757575] italic flex items-center justify-between">
                          <span>Belum diatur</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(k, c)}
                            className="h-7 px-2 text-xs text-[#0075de] hover:bg-[#e6f3fe] rounded-[6px]"
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
          <DialogContent className="max-w-md rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white p-6 shadow-none">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[#111111] font-heading">Ubah Tarif Syahriah</DialogTitle>
              <DialogDescription className="text-xs text-[#757575]">
                Mengubah tarif untuk <strong className="text-[#111111]">{selectedCell.komplek.nama} ({selectedCell.komplek.kode})</strong> pada kategori <strong className="text-[#111111]">{selectedCell.kategori.nama}</strong>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitUpdate} className="space-y-4 pt-2">
              {formError && (
                <Alert variant="destructive" className="py-2.5 rounded-[8px] bg-[#fdeeed] border-[rgba(227,45,20,0.2)] text-[#e32d14]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs font-medium">{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="nominal" className="text-xs font-semibold text-[#111111]">Nominal Total Syahriah (Rp)</Label>
                <Input
                  id="nominal"
                  type="number"
                  min={50000}
                  step={5000}
                  required
                  value={nominalInput}
                  onChange={(e) => setNominalInput(Number(e.target.value))}
                  className="font-mono text-base font-bold text-[#111111] border-[rgba(0,0,0,0.12)] rounded-[8px] focus:ring-[#0075de]"
                />
                <p className="text-[11px] text-[#757575]">Minimal Rp50.000 untuk alokasi tabungan tetap.</p>
              </div>

              {/* Automatic Split Preview */}
              <div className="rounded-[8px] bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] p-3 space-y-2">
                <div className="text-xs font-semibold text-[#111111]">Simulasi Alokasi Otomatis:</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#757575]">Alokasi Tabungan (Tetap):</span>
                  <span className="font-mono font-semibold text-[#2b6e4f]">Rp 50.000</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-[rgba(0,0,0,0.08)]">
                  <span className="text-[#757575]">Alokasi Operasional Komplek:</span>
                  <span className="font-mono font-semibold text-[#111111]">
                    {formatRupiah(Math.max(0, nominalInput - 50000))}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="berlakuMulai" className="text-xs font-semibold text-[#111111]">Berlaku Mulai Tanggal</Label>
                <Input
                  id="berlakuMulai"
                  type="date"
                  required
                  value={berlakuMulai}
                  onChange={(e) => setBerlakuMulai(e.target.value)}
                  className="text-xs border-[rgba(0,0,0,0.12)] rounded-[8px]"
                />
                <p className="text-[11px] text-[#757575]">
                  Tarif lama akan dinonaktifkan dengan tanggal berlaku sampai tanggal ini. Riwayat tagihan masa lalu tidak akan terpengaruh.
                </p>
              </div>

              <DialogFooter className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCell(null)} className="rounded-[8px]">
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-[#0075de] hover:bg-[#0060b8] text-white rounded-[8px] shadow-none">
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
