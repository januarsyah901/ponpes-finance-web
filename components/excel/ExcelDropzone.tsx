'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { validateExcelRowsAction, ValidationSummary, RawExcelRow } from '@/actions/import.actions';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExcelDropzoneProps {
  onValidationComplete: (result: ValidationSummary, filename: string) => void;
  disabled?: boolean;
}

export function ExcelDropzone({ onValidationComplete, disabled }: ExcelDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizeKey = (key: string): string => {
    const k = key.toLowerCase().trim().replace(/[\s_\-\.]+/g, '');
    if (k === 'nis' || k === 'nomorinduk' || k === 'nomorinduksantri') return 'nis';
    if (k === 'nama' || k === 'namasantri' || k === 'namalengkap') return 'nama';
    if (k === 'komplek' || k === 'kodekomplek' || k === 'namakomplek') return 'komplek';
    if (k === 'kategori' || k === 'kategorisantri' || k === 'jenissantri') return 'kategori';
    if (k === 'tanggalmasuk' || k === 'tglmasuk' || k === 'tglbergabung') return 'tanggalMasuk';
    if (k === 'status' || k === 'statussantri') return 'status';
    if (k === 'nowa' || k === 'nomorwa' || k === 'nomorwhatsapp' || k === 'telepon' || k === 'wa') return 'nomorWhatsapp';
    if (k === 'namawali' || k === 'wali') return 'namaWali';
    if (k === 'nowawali' || k === 'nomorwawali' || k === 'whatsappwali') return 'nomorWhatsappWali';
    if (k === 'alamat' || k === 'kotaasal' || k === 'asal') return 'alamat';
    if (k === 'saldoawal' || k === 'saldotabunganawal' || k === 'tabunganawal') return 'saldoAwal';
    return key;
  };

  const processFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Hanya file spreadsheet Microsoft Excel (.xlsx atau .xls) yang diperbolehkan');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // Take first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (rawJson.length === 0) {
        setError('Sheet data kosong, tidak ada baris santri ditemukan.');
        setIsLoading(false);
        return;
      }

      // Map rows with normalized keys
      const normalizedRows: RawExcelRow[] = rawJson.map((row) => {
        const item: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
          const canonical = normalizeKey(key);
          item[canonical] = value;
        }
        return item as RawExcelRow;
      });

      // Submit to server for rigorous validation
      const validationResult = await validateExcelRowsAction(normalizedRows);
      onValidationComplete(validationResult, file.name);
    } catch (err: any) {
      setError(err.message || 'Gagal membaca file Excel. Pastikan file tidak rusak.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <Alert variant="destructive" className="py-2.5 rounded-[18px] bg-[#FCEDEF] border-[rgba(200,76,90,0.2)] text-[#C84C5A]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-[18px] p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#202119] bg-[#F5F5F5]'
            : 'border-[#E8E8E8] bg-white hover:border-[#202119] hover:bg-[#F6F6F6]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          disabled={disabled || isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-[#F5F5F5] text-[#202119] flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-[#202119]" />
            ) : (
              <UploadCloud className="h-7 w-7 text-[#202119]" />
            )}
          </div>

          <div>
            <div className="text-sm font-semibold text-[#202119]">
              {isLoading ? 'Sedang memproses & memvalidasi file Excel...' : 'Tarik & lepas file Excel (.xlsx) di sini'}
            </div>
            <p className="text-xs text-[#626262] mt-1">
              atau klik untuk memilih file dari komputer Anda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
