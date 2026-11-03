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
        <div className="flex items-center gap-2 p-3 rounded-[8px] bg-[#fdeeed] border border-[rgba(227,45,20,0.2)] text-[#e32d14] text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* State A: Result Preview with Compression Stats */}
      {result ? (
        <div className="relative rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white p-4 shadow-none">
          <div className="flex items-start gap-4">
            {/* Thumbnail Preview */}
            <div className="relative h-24 w-24 rounded-[8px] overflow-hidden bg-[#f6f5f4] border border-[rgba(0,0,0,0.08)] shrink-0">
              <img
                src={result.previewUrl}
                alt="Bukti Transfer"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Stats Breakdown */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2b6e4f]">
                <CheckCircle2 className="h-4 w-4 text-[#2b6e4f]" />
                <span>Foto Berhasil Dikompres</span>
              </div>

              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#757575]">
                  <span>Ukuran Asli:</span>
                  <span className="font-mono text-[#111111]">{formatBytes(result.originalSize)}</span>
                </div>
                <div className="flex items-center justify-between text-[#757575]">
                  <span>Ukuran Kompresi:</span>
                  <span className="font-mono font-bold text-[#0075de]">
                    {formatBytes(result.compressedSize)} ({(result.compressionRatio * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#757575]">
                  <span>Dimensi:</span>
                  <span className="font-mono text-[#111111]">{result.dimensions.width} × {result.dimensions.height} px</span>
                </div>
              </div>
            </div>

            {/* Remove Button */}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-[#757575] hover:text-[#e32d14] hover:bg-[#fdeeed] transition-colors cursor-pointer"
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
            'relative flex flex-col items-center justify-center p-6 rounded-[12px] border-2 border-dashed transition-all duration-200',
            isDragging
              ? 'border-[#0075de] bg-[#e6f3fe]'
              : 'border-[rgba(0,0,0,0.12)] bg-white hover:border-[#0075de]/60 hover:bg-[#f6f5f4]',
            (disabled || isProcessing) && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <RefreshCw className="h-8 w-8 text-[#0075de] animate-spin" />
              <p className="text-sm font-medium text-[#111111]">Mengompres bukti transfer...</p>
              <p className="text-xs text-[#757575]">Menyesuaikan ukuran gambar agar di bawah 500 KB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#e6f3fe] flex items-center justify-center text-[#0075de]">
                <UploadCloud className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#111111]">
                  Tarik & lepas foto bukti transfer ke sini
                </p>
                <p className="text-xs text-[#757575] mt-0.5">
                  Format JPG, PNG, atau WebP. Otomatis dikompres &lt; 500 KB
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-[8px] bg-white border border-[rgba(0,0,0,0.12)] text-xs font-medium text-[#111111] hover:bg-[#f6f5f4] transition-colors shadow-none cursor-pointer"
                >
                  Pilih dari Galeri
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#0075de] text-white text-xs font-medium hover:bg-[#0060b8] transition-colors shadow-none cursor-pointer"
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
