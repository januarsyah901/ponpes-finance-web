'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExcelDropzone } from '@/components/excel/ExcelDropzone';
import { ExcelPreviewTable } from '@/components/excel/ExcelPreviewTable';
import { DownloadTemplateButton } from '@/components/excel/DownloadTemplateButton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyDisplay } from '@/components/domain/CurrencyDisplay';
import {
  ValidationSummary,
  commitBatchSantriImportAction,
} from '@/actions/import.actions';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Users,
  PiggyBank,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function ExcelImportPage() {
  const router = useRouter();
  const [validationResult, setValidationResult] = useState<ValidationSummary | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<number | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  const handleValidationComplete = (result: ValidationSummary, name: string) => {
    setValidationResult(result);
    setFilename(name);
    setCommitSuccess(null);
    setCommitError(null);
  };

  const handleCommit = async () => {
    if (!validationResult || validationResult.validRows.length === 0) return;
    setIsCommitting(true);
    setCommitError(null);

    const res = await commitBatchSantriImportAction(validationResult.validRows);

    if (!res.success) {
      setCommitError(res.error || 'Gagal menyimpan data impor');
      setIsCommitting(false);
      return;
    }

    setCommitSuccess(res.insertedCount);
    setIsCommitting(false);

    setTimeout(() => {
      router.push('/master/santri');
      router.refresh();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/master/santri">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
              Impor Data Santri (.xlsx)
            </h1>
            <p className="text-sm text-[#64748B]">
              Unggah file spreadsheet Excel untuk pendaftaran massal santri dan migrasi saldo tabungan awal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DownloadTemplateButton />
        </div>
      </div>

      {/* Success Notification */}
      {commitSuccess !== null && (
        <Alert variant="success" className="py-4 bg-[#ECFDF5] border-[#10B981]">
          <CheckCircle2 className="h-5 w-5 text-[#0F5132]" />
          <AlertDescription className="text-sm font-semibold text-[#064E3B]">
            Berhasil mengimpor {commitSuccess} data santri ke sistem! Mengalihkan ke direktori santri...
          </AlertDescription>
        </Alert>
      )}

      {commitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{commitError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Dropzone */}
      <Card className="border-[#E2E8F0] bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#0F172A]">
            Pilih File Spreadsheet Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExcelDropzone
            onValidationComplete={handleValidationComplete}
            disabled={isCommitting || commitSuccess !== null}
          />
        </CardContent>
      </Card>

      {/* Summary Metrics & Actions if validated */}
      {validationResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-[#64748B] uppercase">Total Baris File</div>
                <div className="text-2xl font-bold text-[#0F172A] font-heading mt-1">
                  {validationResult.totalRows}
                </div>
                <div className="text-xs text-[#94A3B8] mt-0.5 truncate">{filename}</div>
              </CardContent>
            </Card>

            <Card className="border-[#A7F3D0] bg-[#ECFDF5]">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-[#064E3B] uppercase">Baris Valid</div>
                <div className="text-2xl font-bold text-[#064E3B] font-heading mt-1">
                  {validationResult.validRowsCount}
                </div>
                <div className="text-xs text-[#064E3B] mt-0.5">Siap diimpor ke database</div>
              </CardContent>
            </Card>

            <Card className={validationResult.errorRowsCount > 0 ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#E2E8F0] bg-white"}>
              <CardContent className="p-4">
                <div className={`text-xs font-semibold uppercase ${validationResult.errorRowsCount > 0 ? "text-[#991B1B]" : "text-[#64748B]"}`}>
                  Baris Error
                </div>
                <div className={`text-2xl font-bold font-heading mt-1 ${validationResult.errorRowsCount > 0 ? "text-[#991B1B]" : "text-[#0F172A]"}`}>
                  {validationResult.errorRowsCount}
                </div>
                <div className={`text-xs mt-0.5 ${validationResult.errorRowsCount > 0 ? "text-[#991B1B]" : "text-[#64748B]"}`}>
                  {validationResult.errorRowsCount > 0 ? "Perlu perbaikan" : "Nihil error"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] bg-white">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-[#64748B] uppercase">Total Saldo Awal</div>
                <div className="text-xl font-bold font-mono text-[#0F5132] mt-1">
                  <CurrencyDisplay amount={validationResult.totalSaldoAwal} />
                </div>
                <div className="text-xs text-[#64748B] mt-0.5">Dimigrasikan ke buku tabungan</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E2E8F0]">
            <div>
              <div className="text-sm font-semibold text-[#0F172A]">Pratinjau Hasil Validasi</div>
              <p className="text-xs text-[#64748B]">
                Baris valid ditandai warna hijau. Baris error ditandai warna merah dengan keterangan detail.
              </p>
            </div>

            <Button
              onClick={handleCommit}
              disabled={isCommitting || validationResult.validRowsCount === 0 || commitSuccess !== null}
              className="bg-[#0F5132] hover:bg-[#0B3D26] text-white font-medium"
            >
              {isCommitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengimpor Data...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Konfirmasi & Simpan {validationResult.validRowsCount} Santri
                </>
              )}
            </Button>
          </div>

          {/* Interactive Dual-State Preview Table */}
          <ExcelPreviewTable
            validRows={validationResult.validRows}
            errors={validationResult.errors}
          />
        </div>
      )}
    </div>
  );
}
