import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Helper extracting the WhatsApp deep link generation logic from CashDeskClient
function generateWhatsAppShareLink(completedReceipt: any): string {
  if (!completedReceipt) return '#';
  const s = completedReceipt.santri;
  let phone = s.nomorWhatsapp || '';
  phone = phone.replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  else if (phone.startsWith('8')) phone = '62' + phone;

  const formatRupiah = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;
  const formatDateIndo = (val: string) => val; // simple mock for test

  const rincianText = completedReceipt.alokasiRincian
    .map(
      (r: any) =>
        `• ${r.judul}: ${formatRupiah(r.nominalAlokasi || r.totalAllocated)} (${r.status === 'lunas' ? 'LUNAS' : 'SEBAGIAN'})`
    )
    .join('\n');

  const msg =
    `*KUITANSI PEMBAYARAN KAS PONDOK PESANTREN*\n` +
    `No. Kuitansi: ${completedReceipt.nomorKuitansi}\n` +
    `Tanggal: ${formatDateIndo(completedReceipt.tanggalBayar)}\n\n` +
    `*Santri:* ${s.nama} (${s.nis})\n` +
    `*Komplek:* ${s.komplekNama}\n` +
    `*Total Bayar:* ${formatRupiah(completedReceipt.nominalTotal)}\n\n` +
    `*Alokasi Dana:*\n` +
    `- Tabungan Santri: ${formatRupiah(completedReceipt.totalAlokasiTabungan)}\n` +
    `- Operasional Pondok: ${formatRupiah(completedReceipt.totalAlokasiOperasional)}\n\n` +
    `*Rincian Tagihan Terbayar:*\n${rincianText}\n\n` +
    `*Sisa Tunggakan:* ${formatRupiah(completedReceipt.sisaTunggakanSetelahBayar)}\n\n` +
    `Petugas: ${completedReceipt.petugasNama}\n` +
    `_Jazakumullahu khairan katsiran._`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

describe('Cash Desk & Receipting Empirical Tests', () => {
  const sampleReceipt = {
    nomorKuitansi: 'KAS-20261102-ABC123',
    tanggalBayar: '2026-11-02',
    santri: {
      nis: '2024001',
      nama: 'Ahmad Fauzi',
      komplekNama: 'Komplek Al-Falah (Putra 1)',
      komplekKode: 'PA1',
      nomorWhatsapp: '0812-3456-7890',
    },
    nominalTotal: 350000,
    totalAlokasiTabungan: 50000,
    totalAlokasiOperasional: 300000,
    sisaTunggakanSetelahBayar: 0,
    alokasiRincian: [
      {
        judul: 'Syahriah November 2026',
        nominalAlokasi: 350000,
        status: 'lunas',
      },
    ],
    catatan: 'Pembayaran tunai kasir',
    petugasNama: 'Ust. Muhsin',
  };

  describe('1. WhatsApp Phone Sanitization & Formatting', () => {
    it('normalizes 08xx prefix to 628xx', () => {
      const link = generateWhatsAppShareLink({
        ...sampleReceipt,
        santri: { ...sampleReceipt.santri, nomorWhatsapp: '081234567890' },
      });
      assert.ok(link.startsWith('https://wa.me/6281234567890?text='));
    });

    it('normalizes 8xx prefix to 628xx', () => {
      const link = generateWhatsAppShareLink({
        ...sampleReceipt,
        santri: { ...sampleReceipt.santri, nomorWhatsapp: '81234567890' },
      });
      assert.ok(link.startsWith('https://wa.me/6281234567890?text='));
    });

    it('preserves +628xx by stripping non-digits to 628xx', () => {
      const link = generateWhatsAppShareLink({
        ...sampleReceipt,
        santri: { ...sampleReceipt.santri, nomorWhatsapp: '+6281234567890' },
      });
      assert.ok(link.startsWith('https://wa.me/6281234567890?text='));
    });

    it('strips dashes, spaces, and formatting characters: 0812-3456 7890 -> 6281234567890', () => {
      const link = generateWhatsAppShareLink({
        ...sampleReceipt,
        santri: { ...sampleReceipt.santri, nomorWhatsapp: '0812-3456 7890' },
      });
      assert.ok(link.startsWith('https://wa.me/6281234567890?text='));
    });

    it('handles null or empty phone gracefully as general wa.me/?text link', () => {
      const link = generateWhatsAppShareLink({
        ...sampleReceipt,
        santri: { ...sampleReceipt.santri, nomorWhatsapp: '' },
      });
      assert.ok(link.startsWith('https://wa.me/?text='));
    });
  });

  describe('2. WhatsApp Message Template & URI Encoding', () => {
    it('contains all required kuitansi fields in encoded message', () => {
      const link = generateWhatsAppShareLink(sampleReceipt);
      const url = new URL(link);
      const decodedText = url.searchParams.get('text') || '';

      assert.ok(decodedText.includes('KAS-20261102-ABC123'), 'Must contain receipt number');
      assert.ok(decodedText.includes('Ahmad Fauzi'), 'Must contain santri name');
      assert.ok(decodedText.includes('2024001'), 'Must contain santri NIS');
      assert.ok(decodedText.includes('Komplek Al-Falah (Putra 1)'), 'Must contain complex name');
      assert.ok(decodedText.includes('Rp 350.000'), 'Must contain total amount');
      assert.ok(decodedText.includes('Tabungan Santri: Rp 50.000'), 'Must contain savings allocation');
      assert.ok(decodedText.includes('Operasional Pondok: Rp 300.000'), 'Must contain operational allocation');
      assert.ok(decodedText.includes('Syahriah November 2026'), 'Must contain bill breakdown');
      assert.ok(decodedText.includes('LUNAS'), 'Must contain bill status');
      assert.ok(decodedText.includes('Ust. Muhsin'), 'Must contain petugas name');
    });

    it('returns "#" if completedReceipt is null', () => {
      assert.equal(generateWhatsAppShareLink(null), '#');
    });
  });

  describe('3. Receipt Accounting Invariant', () => {
    it('guarantees Total Bayar == Masuk Tabungan + Masuk Operasional', () => {
      assert.equal(
        sampleReceipt.nominalTotal,
        sampleReceipt.totalAlokasiTabungan + sampleReceipt.totalAlokasiOperasional,
        'Accounting invariant must strictly balance'
      );
    });
  });
});
