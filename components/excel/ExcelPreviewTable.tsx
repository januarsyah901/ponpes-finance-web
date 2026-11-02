'use client';

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { ValidatedImportItem, ImportErrorItem } from '@/actions/import.actions';
import { cn } from '@/lib/utils';

interface ExcelPreviewTableProps {
  validRows: ValidatedImportItem[];
  errors: ImportErrorItem[];
}

export function ExcelPreviewTable({ validRows, errors }: ExcelPreviewTableProps) {
  // Combine all rows by rowIndex for unified preview
  const errorMap = new Map<number, ImportErrorItem[]>();
  errors.forEach((err) => {
    const list = errorMap.get(err.rowIndex) || [];
    list.push(err);
    errorMap.set(err.rowIndex, list);
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Baris</TableHead>
              <TableHead>NIS</TableHead>
              <TableHead>Nama Santri</TableHead>
              <TableHead>Komplek</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Saldo Awal</TableHead>
              <TableHead>Status Validasi / Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 1. Error rows displayed with red warning highlight */}
            {errors.map((err, idx) => (
              <TableRow key={`err-${idx}`} className="bg-[#FEF2F2] border-b border-[#FECACA] hover:bg-[#FEE2E2]">
                <TableCell className="font-mono text-xs font-bold text-[#991B1B]">
                  #{err.rowIndex}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#991B1B]">
                  {err.nis || '-'}
                </TableCell>
                <TableCell className="text-xs text-[#991B1B]">
                  {err.field ? `Field: ${err.field}` : '-'}
                </TableCell>
                <TableCell colSpan={4} className="text-xs font-medium text-[#991B1B]">
                  {err.message}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#991B1B] bg-white px-2 py-0.5 rounded border border-[#FECACA]">
                    <AlertCircle className="h-3.5 w-3.5 text-[#EF4444]" />
                    Gagal Validasi
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {/* 2. Valid rows displayed with green highlight */}
            {validRows.map((item) => (
              <TableRow key={`valid-${item.rowIndex}`} className="bg-[#ECFDF5]/50 border-b border-[#A7F3D0] hover:bg-[#ECFDF5]">
                <TableCell className="font-mono text-xs text-[#064E3B] font-semibold">
                  #{item.rowIndex}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#064E3B]">
                  {item.nis}
                </TableCell>
                <TableCell className="font-medium text-xs text-[#0F172A]">
                  {item.nama}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px] bg-white border-[#A7F3D0] text-[#064E3B]">
                    {item.komplekKode}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[#475569]">
                  {item.kategoriKode}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#334155]">
                  {item.nomorWhatsapp}
                </TableCell>
                <TableCell>
                  <CurrencyDisplay amount={item.saldoAwalTabungan} className="text-xs text-[#0F5132]" />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#064E3B] bg-white px-2 py-0.5 rounded border border-[#A7F3D0]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981]" />
                    Siap Diimpor
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
