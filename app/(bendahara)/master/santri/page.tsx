export const dynamic = 'force-dynamic';

import { getSantriList, getKomplekList, getKategoriList } from '@/actions/master.actions';
import { SantriTable } from '@/components/master/SantriTable';

export default async function SantriMasterPage() {
  const [santriList, complexes, categories] = await Promise.all([
    getSantriList(),
    getKomplekList(),
    getKategoriList(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111111] font-heading">
          Direktori Santri
        </h1>
        <p className="text-sm text-[#757575]">
          Kelola profil seluruh santri aktif dan boyong di lingkungan pondok pesantren.
        </p>
      </div>

      <SantriTable
        initialSantri={santriList}
        complexes={complexes}
        categories={categories}
      />
    </div>
  );
}
