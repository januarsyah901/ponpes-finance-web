import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'lunas'
  | 'sebagian'
  | 'belum_bayar'
  | 'dibatalkan'
  | 'terverifikasi'
  | 'menunggu_verifikasi'
  | 'ditolak'
  | 'aktif'
  | 'boyong';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'warning' | 'destructive' | 'outline' }
> = {
  lunas: { label: 'Lunas', variant: 'secondary' },
  terverifikasi: { label: 'Terverifikasi', variant: 'secondary' },
  aktif: { label: 'Aktif', variant: 'secondary' },
  sebagian: { label: 'Cicilan', variant: 'warning' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', variant: 'warning' },
  belum_bayar: { label: 'Belum Bayar', variant: 'destructive' },
  ditolak: { label: 'Ditolak', variant: 'destructive' },
  dibatalkan: { label: 'Dibatalkan', variant: 'outline' },
  boyong: { label: 'Boyong', variant: 'outline' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };

  return (
    <Badge variant={config.variant} className={cn("capitalize font-medium", className)}>
      {config.label}
    </Badge>
  );
}
