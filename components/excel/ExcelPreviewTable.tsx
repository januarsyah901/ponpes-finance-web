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
      <div className="rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white overflow-hidden shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f6f5f4] border-b border-[rgba(0,0,0,0.08)]">
              <TableHead className="w-16 text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">Baris</TableHead>
              <TableHead className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">NIS</TableHead>
              <TableHead className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">Nama Santri</TableHead>
              <TableHead className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">Komplek</TableHead>
              <TableHead className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">Kategori</TableHead>
              <TableHead className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">WhatsApp</TableHead>
              <TableHead className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">Saldo Awal</TableHead>
              <TableHead className="text-xs font-semibold text-[rgba(0,0,0,0.6)] uppercase tracking-wider">Status Validasi / Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 1. Error rows displayed with red warning highlight */}
            {errors.map((err, idx) => (
              <TableRow key={`err-${idx}`} className="bg-[#fdeeed] border-b border-[rgba(227,45,20,0.15)] hover:bg-[#fbdcd9]">
                <TableCell className="font-mono text-xs font-bold text-[#e32d14]">
                  #{err.rowIndex}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#e32d14]">
                  {err.nis || '-'}
                </TableCell>
                <TableCell className="text-xs text-[#e32d14]">
                  {err.field ? `Field: ${err.field}` : '-'}
                </TableCell>
                <TableCell colSpan={4} className="text-xs font-medium text-[#e32d14]">
                  {err.message}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#e32d14] bg-white px-2 py-0.5 rounded-[4px] border border-[rgba(227,45,20,0.2)]">
                    <AlertCircle className="h-3.5 w-3.5 text-[#e32d14]" />
                    Gagal Validasi
                  </span>
                </TableCell>
              </TableRow>
            ))}

            {/* 2. Valid rows displayed with green highlight */}
            {validRows.map((item) => (
              <TableRow key={`valid-${item.rowIndex}`} className="bg-[#ebf5ee]/40 border-b border-[rgba(43,110,79,0.15)] hover:bg-[#ebf5ee]">
                <TableCell className="font-mono text-xs text-[#2b6e4f] font-semibold">
                  #{item.rowIndex}
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[#2b6e4f]">
                  {item.nis}
                </TableCell>
                <TableCell className="font-medium text-xs text-[#111111]">
                  {item.nama}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px] bg-white border-[rgba(43,110,79,0.2)] text-[#2b6e4f]">
                    {item.komplekKode}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-[#757575]">
                  {item.kategoriKode}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#111111]">
                  {item.nomorWhatsapp}
                </TableCell>
                <TableCell>
                  <CurrencyDisplay amount={item.saldoAwalTabungan} className="text-xs text-[#2b6e4f]" />
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2b6e4f] bg-white px-2 py-0.5 rounded-[4px] border border-[rgba(43,110,79,0.2)]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#2b6e4f]" />
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
