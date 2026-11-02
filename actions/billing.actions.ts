'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import { BulkSyahriahGenerateSchema } from '@ponpes-finance/db/validators';
import { generateBulkSyahriahBills } from '@ponpes-finance/db';
import { revalidatePath } from 'next/cache';

export async function generateBulkSyahriahAction(data: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: 'Tidak memiliki izin (Unauthorized)' };
  }

  const { role, complexIds } = session.user;
  if (role !== 'super_admin' && role !== 'bendahara_komplek') {
    return { success: false, error: 'Hanya bendahara atau super admin yang dapat membuat tagihan syahriah' };
  }

  const parsed = BulkSyahriahGenerateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Input parameter tagihan tidak valid',
    };
  }

  try {
    const result = await generateBulkSyahriahBills(db, parsed.data, {
      userId: session.user.id,
      role: session.user.role,
      complexIds: complexIds || [],
    });

    if (result.success) {
      revalidatePath('/bendahara/tagihan');
      revalidatePath('/bendahara');
    }

    return result;
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghasilkan tagihan syahriah' };
  }
}
