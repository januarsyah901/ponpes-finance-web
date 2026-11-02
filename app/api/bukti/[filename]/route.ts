import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { readFile } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { pembayaran } from '@ponpes-finance/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const session = await auth();

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Sanitize filename against directory traversal
  const safeFilename = path.basename(filename);
  const targetPath = path.join(process.cwd(), 'public', 'uploads', 'bukti', safeFilename);

  try {
    // RBAC: If santri, ensure this proof belongs to them
    if (session.user.role === 'santri') {
      const publicUrl = `/uploads/bukti/${safeFilename}`;
      const [record] = await db
        .select({ santriId: pembayaran.santriId })
        .from(pembayaran)
        .where(eq(pembayaran.buktiUrl, publicUrl))
        .limit(1);

      if (record && record.santriId !== session.user.santriId) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }

    const fileBuffer = await readFile(targetPath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('File tidak ditemukan', { status: 404 });
  }
}
