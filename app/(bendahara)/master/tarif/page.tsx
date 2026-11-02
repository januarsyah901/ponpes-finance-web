export const dynamic = 'force-dynamic';

import { getTarifMatrix } from '@/actions/tarif.actions';
import { TarifMatrixTable } from '@/components/master/TarifMatrixTable';

export default async function TarifMasterPage() {
  const { complexes, categories, rates } = await getTarifMatrix();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] font-heading">
          Matriks Jadwal Tarif Syahriah
        </h1>
        <p className="text-sm text-[#64748B]">
          Tarif ditentukan berdasarkan kombinasi komplek asrama dan kategori santri. Alokasi tabungan tetap Rp50.000 per syahriah.
        </p>
      </div>

      <TarifMatrixTable
        complexes={complexes}
        categories={categories}
        rates={rates}
      />
    </div>
  );
}
