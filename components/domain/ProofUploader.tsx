'use client';

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, X, Camera, RefreshCw } from 'lucide-react';
import { compressImage, formatBytes, CompressionResult } from '@/lib/image-compression';
import { cn } from '@/lib/utils';

interface ProofUploaderProps {
  onImageCompressed: (result: CompressionResult | null) => void;
  className?: string;
  disabled?: boolean;
}

export function ProofUploader({
  onImageCompressed,
  className,
  disabled = false,
}: ProofUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      const compressionRes = await compressImage(file);
      setResult(compressionRes);
      onImageCompressed(compressionRes);
    } catch (err: any) {
      const errMsg = err?.message || 'Terjadi kesalahan saat mengompres gambar.';
      setError(errMsg);
      setResult(null);
      onImageCompressed(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleClear = () => {
    if (result?.previewUrl) {
      URL.revokeObjectURL(result.previewUrl);
    }
    setResult(null);
    setError(null);
    onImageCompressed(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
      />

      {/* Error Notice */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* State A: Result Preview with Compression Stats */}
      {result ? (
        <div className="relative rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Thumbnail Preview */}
            <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <img
                src={result.previewUrl}
                alt="Bukti Transfer"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Stats Breakdown */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F5132]">
                <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                <span>Foto Berhasil Dikompres</span>
              </div>

              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Ukuran Asli:</span>
                  <span className="font-mono text-[#0F172A]">{formatBytes(result.originalSize)}</span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Ukuran Kompresi:</span>
                  <span className="font-mono font-bold text-[#0F5132]">
                    {formatBytes(result.compressedSize)} ({(result.compressionRatio * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Dimensi:</span>
                  <span className="font-mono">{result.dimensions.width} × {result.dimensions.height} px</span>
                </div>
              </div>
            </div>

            {/* Remove Button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                title="Hapus dan unggah ulang"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* State B: Dropzone & Mobile Camera Button */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all duration-200',
            isDragging
              ? 'border-[#0F5132] bg-[#EBF5F0]'
              : 'border-[#CBD5E1] bg-white hover:border-[#0F5132]/60 hover:bg-[#F8FAFC]',
            (disabled || isProcessing) && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <RefreshCw className="h-8 w-8 text-[#0F5132] animate-spin" />
              <p className="text-sm font-medium text-[#0F172A]">Mengompres bukti transfer...</p>
              <p className="text-xs text-[#64748B]">Menyesuaikan ukuran gambar agar di bawah 500 KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#EBF5F0] flex items-center justify-center text-[#0F5132]">
                <UploadCloud className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#0F172A]">
                  Tarik & lepas foto bukti transfer ke sini
                </p>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Format JPG, PNG, atau WebP. Otomatis dikompres &lt; 500 KB
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  Pilih dari Galeri
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F5132] text-white text-xs font-semibold hover:bg-[#0F5132]/90 transition-colors shadow-sm cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Ambil Foto HP</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
