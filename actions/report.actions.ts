'use server';

import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  getFinancialSummaryReport,
  getSantriSavingsBalancesReport,
} from '@ponpes-finance/db';

async function requireBendaharaAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Tidak terautentikasi');
  }
  if (session.user.role !== 'bendahara_komplek' && session.user.role !== 'super_admin') {
    throw new Error('Hanya bendahara yang berhak mengakses laporan keuangan');
  }
  return session.user;
}

export async function getFinancialSummaryAction(filter: {
  komplekId?: string;
  startDate: string;
  endDate: string;
}) {
  await requireBendaharaAuth();
  try {
    const report = await getFinancialSummaryReport(db, filter);
    return { success: true, data: report };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memuat ringkasan keuangan' };
  }
}

export async function getSantriSavingsReportAction(filter?: { komplekId?: string }) {
  await requireBendaharaAuth();
  try {
    const report = await getSantriSavingsBalancesReport(db, filter);
    return { success: true, data: report };
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal memuat laporan saldo tabungan' };
  }
}
