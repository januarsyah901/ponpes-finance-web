import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE_BYTES = 500 * 1024; // 512,000 bytes (500 KB)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Guard
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Harap login terlebih dahulu' },
        { status: 401 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const santriId = formData.get('santriId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File bukti transfer tidak ditemukan' },
        { status: 400 }
      );
    }

    // 3. Defensive Validation: File Size strictly < 500 KB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Ukuran file (${(file.size / 1024).toFixed(1)} KB) melebihi batas maksimal 500 KB`,
        },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File kosong (0 bytes)' },
        { status: 400 }
      );
    }

    // 4. Defensive Validation: MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Format file ${file.type} tidak didukung. Harap unggah JPG, PNG, atau WebP`,
        },
        { status: 400 }
      );
    }

    // 5. Generate collision-resistant unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeSantriPrefix = (santriId || session.user.id || 'usr').slice(0, 8);
    const filename = `bukti-${safeSantriPrefix}-${Date.now()}-${randomHex}.${ext}`;

    // 6. Write file to local uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'bukti');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/bukti/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      sizeBytes: file.size,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal menyimpan file ke server' },
      { status: 500 }
    );
  }
}
