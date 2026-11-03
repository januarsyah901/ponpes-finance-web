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
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[8px] hover:bg-[#F5F5F5]">
              <ArrowLeft className="h-4 w-4 text-[#202119]" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#202119] font-sans">
              Impor Data Santri (.xlsx)
            </h1>
            <p className="text-sm text-[#626262]">
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
        <Alert variant="success" className="py-3 rounded-[18px] bg-[#EAF7EF] border border-[rgba(43,138,96,0.2)] text-[#2B8A60]">
          <CheckCircle2 className="h-5 w-5 text-[#2B8A60]" />
          <AlertDescription className="text-sm font-semibold text-[#2B8A60]">
            Berhasil mengimpor {commitSuccess} data santri ke sistem! Mengalihkan ke direktori santri...
          </AlertDescription>
        </Alert>
      )}

      {commitError && (
        <Alert variant="destructive" className="py-2.5 rounded-[18px] bg-[#FCEDEF] border border-[rgba(200,76,90,0.2)] text-[#C84C5A]">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">{commitError}</AlertDescription>
        </Alert>
      )}

      {/* Upload Dropzone */}
      <Card className="rounded-[18px] border border-[#E8E8E8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[#202119]">
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
            <Card className="rounded-[18px] border border-[#E8E8E8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-[#626262] uppercase tracking-wider">Total Baris File</div>
                <div className="text-2xl font-bold text-[#202119] font-sans mt-1">
                  {validationResult.totalRows}
                </div>
                <div className="text-xs text-[#626262] mt-0.5 truncate">{filename}</div>
              </CardContent>
            </Card>

            <Card className="rounded-[18px] border border-[rgba(43,138,96,0.2)] bg-[#EAF7EF] shadow-none">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-[#2B8A60] uppercase tracking-wider">Baris Valid</div>
                <div className="text-2xl font-bold text-[#2B8A60] font-sans mt-1">
                  {validationResult.validRowsCount}
                </div>
                <div className="text-xs text-[#2B8A60] mt-0.5">Siap diimpor ke database</div>
              </CardContent>
            </Card>

            <Card className={validationResult.errorRowsCount > 0 ? "rounded-[18px] border border-[rgba(200,76,90,0.2)] bg-[#FCEDEF] shadow-none" : "rounded-[18px] border border-[#E8E8E8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]"}>
              <CardContent className="p-4">
                <div className={`text-xs font-semibold uppercase tracking-wider ${validationResult.errorRowsCount > 0 ? "text-[#C84C5A]" : "text-[#626262]"}`}>
                  Baris Error
                </div>
                <div className={`text-2xl font-bold font-sans mt-1 ${validationResult.errorRowsCount > 0 ? "text-[#C84C5A]" : "text-[#202119]"}`}>
                  {validationResult.errorRowsCount}
                </div>
                <div className={`text-xs mt-0.5 ${validationResult.errorRowsCount > 0 ? "text-[#C84C5A]" : "text-[#626262]"}`}>
                  {validationResult.errorRowsCount > 0 ? "Perlu perbaikan" : "Nihil error"}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[18px] border border-[#E8E8E8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <CardContent className="p-4">
                <div className="text-xs font-semibold text-[#626262] uppercase tracking-wider">Total Saldo Awal</div>
                <div className="text-xl font-bold font-sans tabular-nums text-[#202119] mt-1">
                  <CurrencyDisplay amount={validationResult.totalSaldoAwal} />
                </div>
                <div className="text-xs text-[#626262] mt-0.5">Dimigrasikan ke buku tabungan</div>
              </CardContent>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-white rounded-[18px] border border-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div>
              <div className="text-sm font-semibold text-[#202119]">Pratinjau Hasil Validasi</div>
              <p className="text-xs text-[#626262]">
                Baris valid ditandai warna hijau. Baris error ditandai warna merah dengan keterangan detail.
              </p>
            </div>

            <Button
              onClick={handleCommit}
              disabled={isCommitting || validationResult.validRowsCount === 0 || commitSuccess !== null}
              className="bg-[#202119] hover:bg-[#2e2f26] text-white font-medium rounded-[8px] shadow-none focus-visible:ring-[#315FC4]"
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
