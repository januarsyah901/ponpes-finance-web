'use client';

import React, { useState } from 'react';
import { createSubsidyRuleAction } from '@/actions/subsidy.actions';

interface ComplexItem {
  id: string;
  kode: string;
  nama: string;
}

interface EventBillOption {
  id: string;
  judul: string;
  tipe: string;
  nominal: number;
}

interface SubsidyRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  complexList: ComplexItem[];
  eventBillsList: EventBillOption[];
  onSuccess?: () => void;
}

export function SubsidyRuleBuilderModal({
  isOpen,
  onClose,
  complexList,
  eventBillsList,
  onSuccess,
}: SubsidyRuleBuilderModalProps) {
  const [nama, setNama] = useState('');
  const [nominal, setNominal] = useState<number | ''>('');
  const [targetType, setTargetType] = useState<'syahriah' | 'kegiatan'>('syahriah');
  const [tagihanKegiatanId, setTagihanKegiatanId] = useState<string>('');
  const [sumberDana, setSumberDana] = useState<'bantuan_langsung' | 'potong_tabungan'>('bantuan_langsung');
  const [cakupan, setCakupan] = useState<'nominal_tetap' | 'lunas_penuh'>('nominal_tetap');

  // AND conditions
  const [selectedComplexIds, setSelectedComplexIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minTunggakan, setMinTunggakan] = useState<number | ''>('');
  const [maxSaldoTabungan, setMaxSaldoTabungan] = useState<number | ''>('');
  const [minLamaMondok, setMinLamaMondok] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numNominal = Number(nominal) || 0;
  const isInvalid = !nama.trim() || numNominal <= 0;

  const handleToggleComplex = (id: string) => {
    setSelectedComplexIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isInvalid) return;

    setLoading(true);
    setError(null);

    const syaratJson: any = {
      sumberDana,
      cakupan,
      tipeTarget: targetType,
    };

    if (selectedComplexIds.length > 0) syaratJson.komplekIds = selectedComplexIds;
    if (selectedCategories.length > 0) syaratJson.kategoriIds = selectedCategories;
    if (minTunggakan !== '') syaratJson.minTagihanTertunggak = Number(minTunggakan);
    if (maxSaldoTabungan !== '') syaratJson.maxSaldoTabungan = Number(maxSaldoTabungan);
    if (minLamaMondok !== '') syaratJson.minLamaMondokBulan = Number(minLamaMondok);

    try {
      const res = await createSubsidyRuleAction({
        nama: nama.trim(),
        nominal: numNominal,
        tagihanKegiatanId: targetType === 'kegiatan' && tagihanKegiatanId ? tagihanKegiatanId : null,
        syaratJson,
      });

      if (!res.success) {
        setError(res.error || 'Gagal membuat aturan subsidi.');
      } else {
        onSuccess?.();
        handleClose();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNama('');
    setNominal('');
    setSelectedComplexIds([]);
    setSelectedCategories([]);
    setMinTunggakan('');
    setMaxSaldoTabungan('');
    setMinLamaMondok('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#0F5132] px-6 py-4 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold font-heading">Buat Aturan Subsidi Baru</h3>
            <p className="text-xs text-emerald-100">Kombinasi multi-kriteria evaluasi kelayakan santri (AND logic)</p>
          </div>
          <button
            onClick={handleClose}
            className="text-emerald-100 hover:text-white text-2xl leading-none"
            aria-label="Tutup"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Nama Aturan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Aturan Subsidi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Subsidi Keringanan Syahriah Dhuafa Semester Ganjil"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              required
            />
          </div>

          {/* Nominal Bantuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Bantuan per Santri (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={nominal}
                onChange={(e) => setNominal(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 150000"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sumber Pendanaan <span className="text-red-500">*</span>
              </label>
              <select
                value={sumberDana}
                onChange={(e) => setSumberDana(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              >
                <option value="bantuan_langsung">Bantuan Langsung (Kas Pesantren / Donatur)</option>
                <option value="potong_tabungan">Potong Tabungan Santri Sendiri</option>
              </select>
            </div>
          </div>

          {/* Target Tagihan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Tagihan Sasaran
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
              >
                <option value="syahriah">Tagihan Syahriah Bulanan</option>
                <option value="kegiatan">Tagihan Kegiatan Khusus</option>
              </select>
            </div>

            {targetType === 'kegiatan' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Tagihan Kegiatan
                </label>
                <select
                  value={tagihanKegiatanId}
                  onChange={(e) => setTagihanKegiatanId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                >
                  <option value="">-- Pilih Kegiatan --</option>
                  {eventBillsList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.judul} (Rp{Number(b.nominal).toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Kriteria Kelayakan (AND Conditions) */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Kriteria Kelayakan Sasaran (Semua Kondisi AND)
            </h4>

            {/* Target Komplek */}
            <div className="mb-3">
              <label className="block text-xs text-slate-600 mb-1 font-medium">
                Komplek Santri (Kosongkan jika semua komplek)
              </label>
              <div className="flex flex-wrap gap-2">
                {complexList.map((c) => {
                  const checked = selectedComplexIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleComplex(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        checked
                          ? 'bg-[#0F5132] text-white border-[#0F5132]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c.kode} ({c.nama})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Kategori */}
            <div className="mb-3">
              <label className="block text-xs text-slate-600 mb-1 font-medium">
                Kategori Santri (Kosongkan jika semua kategori)
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'pengurus', label: 'Pengurus' },
                  { id: 'non_pengurus', label: 'Non Pengurus' },
                  { id: 'mbak_ndalem', label: 'Mbak Ndalem' },
                ].map((cat) => {
                  const checked = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        checked
                          ? 'bg-[#0F5132] text-white border-[#0F5132]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Arrears & Savings limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">
                  Min. Tagihan Tertunggak
                </label>
                <input
                  type="number"
                  min="0"
                  value={minTunggakan}
                  onChange={(e) => setMinTunggakan(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 2 bulan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">
                  Maks. Saldo Tabungan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxSaldoTabungan}
                  onChange={(e) => setMaxSaldoTabungan(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 100000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">
                  Min. Lama Mondok (Bulan)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minLamaMondok}
                  onChange={(e) => setMinLamaMondok(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 6 bulan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isInvalid || loading}
              className="flex-1 py-2.5 px-4 bg-[#0F5132] hover:bg-[#0b3d26] disabled:bg-slate-300 text-white font-medium rounded-xl text-sm transition"
            >
              {loading ? 'Menyimpan...' : 'Simpan Aturan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
