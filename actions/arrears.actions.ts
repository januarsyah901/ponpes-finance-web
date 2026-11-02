'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  getArrearsDashboard,
  markReminderSent,
} from '@ponpes-finance/db';
import { revalidatePath } from 'next/cache';

async function requireBendaharaAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak terautentikasi');
  }
  if (session.user.role !== 'bendahara_komplek' && session.user.role !== 'super_admin') {
    throw new Error('Hanya bendahara yang berhak mengakses data tunggakan');
  }
  return session.user;
}

export async function getArrearsDashboardAction(filter?: {
  komplekId?: string;
  minMonths?: number;
}) {
  await requireBendaharaAuth();
  try {
    const list = await getArrearsDashboard(db, filter);
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memuat daftar penunggak' };
  }
}

export async function markWaReminderSentAction(santriId: string) {
  const user = await requireBendaharaAuth();
  try {
    const updated = await markReminderSent(db, {
      santriId,
      adminUserId: user.id,
    });
    revalidatePath('/bendahara/penunggak');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mencatat pengingat' };
  }
}
