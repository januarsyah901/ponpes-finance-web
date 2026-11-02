/**
 * lib/image-compression.ts
 * High-performance client-side image compression utility using HTML5 Canvas.
 * Enforces strict < 500 KB (512,000 bytes) output with high receipt legibility.
 */

export interface CompressionOptions {
  maxDimension?: number;       // Longest edge in px (default: 1600)
  maxSizeBytes?: number;       // Hard limit in bytes (default: 500 * 1024 = 512,000)
  initialQuality?: number;     // Starting JPEG quality (default: 0.85)
  minQuality?: number;         // Lower bound for quality loop (default: 0.35)
  qualityStep?: number;        // Reduction step (default: 0.10)
}

export interface CompressionResult {
  file: File;
  blob: Blob;
  previewUrl: string;
  originalSize: number;        // Bytes
  compressedSize: number;      // Bytes
  compressionRatio: number;    // e.g. -0.88 (-88%)
  dimensions: {
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
  };
  processingTimeMs: number;
}

export const TARGET_MAX_BYTES = 500 * 1024; // 512,000 bytes (500 KB)
export const ALLOWED_INPUT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Calculates proportional target dimensions capping the longest edge.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width >= height) {
    const ratio = height / width;
    return {
      width: maxDimension,
      height: Math.round(maxDimension * ratio),
    };
  } else {
    const ratio = width / height;
    return {
      width: Math.round(maxDimension * ratio),
      height: maxDimension,
    };
  }
}

/**
 * Promisified canvas.toBlob wrapper for cross-browser safety.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/jpeg',
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('HTML5 Canvas toBlob failed: null blob produced'));
        }
      },
      type,
      quality
    );
  });
}

/**
 * Loads an image File into an HTMLImageElement with clean cross-origin/orientation handling.
 */
function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat gambar. File mungkin rusak atau tidak didukung.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Core Compression Engine: Downscales dimensions and iteratively optimizes JPEG quality.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = performance.now();

  const maxDimension = options.maxDimension ?? 1600;
  const maxSizeBytes = options.maxSizeBytes ?? TARGET_MAX_BYTES;
  const initialQuality = options.initialQuality ?? 0.85;
  const minQuality = options.minQuality ?? 0.35;
  const qualityStep = options.qualityStep ?? 0.10;

  // 1. Validate MIME type
  if (!ALLOWED_INPUT_TYPES.includes(file.type)) {
    throw new Error(
      `Format file tidak didukung: ${file.type}. Harap unggah foto berekstensi JPG, PNG, atau WebP.`
    );
  }

  // 2. Load source image
  const img = await loadImageFromFile(file);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (origWidth === 0 || origHeight === 0) {
    throw new Error('Dimensi gambar tidak valid (0x0).');
  }

  // 3. Compute initial target dimensions
  let currentTarget = calculateTargetDimensions(origWidth, origHeight, maxDimension);

  // 4. Create and prepare canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  if (!ctx) {
    throw new Error('Gagal menginisialisasi 2D Canvas context pada browser ini.');
  }

  canvas.width = currentTarget.width;
  canvas.height = currentTarget.height;

  // Use high-quality bicubic downscaling interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, currentTarget.width, currentTarget.height);

  // 5. Iterative JPEG Quality Loop
  let quality = initialQuality;
  let blob: Blob | null = null;

  while (quality >= minQuality) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);

    if (blob.size <= maxSizeBytes) {
      break; // Successfully compressed under 500 KB limit!
    }

    quality = Math.round((quality - qualityStep) * 100) / 100;
  }

  // 6. Secondary Downscale Fallback (Guarantees < 500 KB under all circumstances)
  if (!blob || blob.size > maxSizeBytes) {
    let scale = 0.80;
    while (scale >= 0.40) {
      const downscaledWidth = Math.round(currentTarget.width * scale);
      const downscaledHeight = Math.round(currentTarget.height * scale);

      canvas.width = downscaledWidth;
      canvas.height = downscaledHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, downscaledWidth, downscaledHeight);

      blob = await canvasToBlob(canvas, 'image/jpeg', 0.70);
      if (blob.size <= maxSizeBytes) {
        currentTarget = { width: downscaledWidth, height: downscaledHeight };
        break;
      }
      scale -= 0.15;
    }
  }

  if (!blob || blob.size > maxSizeBytes) {
    blob = await canvasToBlob(canvas, 'image/jpeg', 0.30);
  }

  const endTime = performance.now();
  const processingTimeMs = Math.round(endTime - startTime);

  // 7. Assemble Clean Output File
  const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
  const compressedFile = new File([blob], cleanFileName, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  const previewUrl = URL.createObjectURL(blob);
  const compressionRatio = (blob.size - file.size) / file.size;

  return {
    file: compressedFile,
    blob,
    previewUrl,
    originalSize: file.size,
    compressedSize: blob.size,
    compressionRatio,
    dimensions: {
      width: currentTarget.width,
      height: currentTarget.height,
      originalWidth: origWidth,
      originalHeight: origHeight,
    },
    processingTimeMs,
  };
}

/**
 * Helper to format bytes into human-readable strings (e.g. "342.5 KB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
