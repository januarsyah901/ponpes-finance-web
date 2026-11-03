'use client';

import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function DownloadTemplateButton() {
  const handleDownload = () => {
    const templateData = [
      {
        'NIS': '2024010',
        'Nama': 'Zainal Abidin',
        'Komplek': 'PA1',
        'Kategori': 'non_pengurus',
        'Tanggal Masuk': '2024-07-15',
        'Status': 'aktif',
        'No WhatsApp': '081234567890',
        'Saldo Awal': 250000,
        'Nama Wali': 'H. Sulaiman',
        'No WA Wali': '081234567899',
        'Alamat': 'Yogyakarta',
      },
      {
        'NIS': '2024011',
        'Nama': 'Dewi Sartika',
        'Komplek': 'PI1',
        'Kategori': 'pengurus',
        'Tanggal Masuk': '2023-07-10',
        'Status': 'aktif',
        'No WhatsApp': '081234567891',
        'Saldo Awal': 300000,
        'Nama Wali': 'Bpk. Ridwan',
        'No WA Wali': '081234567898',
        'Alamat': 'Solo',
      },
      {
        'NIS': '2024012',
        'Nama': 'Siti Maryam',
        'Komplek': 'PI2',
        'Kategori': 'mbak_ndalem',
        'Tanggal Masuk': '2024-01-20',
        'Status': 'aktif',
        'No WhatsApp': '081234567892',
        'Saldo Awal': 0,
        'Nama Wali': 'Ibu Fatimah',
        'No WA Wali': '081234567897',
        'Alamat': 'Magelang',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');

    // Auto-fit column widths
    const colWidths = [
      { wch: 12 }, // NIS
      { wch: 22 }, // Nama
      { wch: 10 }, // Komplek
      { wch: 16 }, // Kategori
      { wch: 15 }, // Tanggal Masuk
      { wch: 10 }, // Status
      { wch: 16 }, // No WA
      { wch: 14 }, // Saldo Awal
      { wch: 18 }, // Nama Wali
      { wch: 16 }, // No WA Wali
      { wch: 18 }, // Alamat
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'Template_Impor_Santri_Ponpes.xlsx');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className="gap-1.5 border border-[rgba(0,0,0,0.12)] bg-white hover:bg-[#f6f5f4] text-[#111111] rounded-[8px] shadow-none"
    >
      <Download className="h-4 w-4 text-[#0075de]" />
      <span>Unduh Template Excel</span>
    </Button>
  );
}
