export function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal).replace(/\s+/g, ' ');
}

export function formatDateIndo(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export const formatTanggalIndo = formatDateIndo;

export const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatMonthYear(bulan: number, tahun: number): string {
  const monthName = INDO_MONTHS[bulan - 1] || `Bulan ${bulan}`;
  return `${monthName} ${tahun}`;
}

export function sanitizeIndonesianPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  if (!/^628[1-9][0-9]{7,11}$/.test(cleaned)) {
    throw new Error(`Nomor WhatsApp tidak valid: ${phone}`);
  }
  return cleaned;
}
