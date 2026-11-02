import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { komplek, kategoriPengeluaran } from '@ponpes-finance/db/schema';
import { listPengeluaran } from '@ponpes-finance/db';
import { BendaharaExpensesClient } from '@/components/features/bendahara/BendaharaExpensesClient';

export default async function BendaharaPengeluaranPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const [complexList, categoryList, initialExpenses] = await Promise.all([
    db.select({ id: komplek.id, nama: komplek.nama }).from(komplek),
    db.select({ id: kategoriPengeluaran.id, nama: kategoriPengeluaran.nama }).from(kategoriPengeluaran),
    listPengeluaran(db),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <BendaharaExpensesClient
        complexList={complexList}
        categoryList={categoryList}
        initialExpenses={initialExpenses as any}
      />
    </div>
  );
}
