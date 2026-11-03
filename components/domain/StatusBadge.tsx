import React from 'react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
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
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  lunas: { label: 'Lunas', variant: 'success' },
  terverifikasi: { label: 'Terverifikasi', variant: 'success' },
  aktif: { label: 'Aktif', variant: 'success' },
  sebagian: { label: 'Cicilan', variant: 'warning' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', variant: 'warning' },
  belum_bayar: { label: 'Belum Bayar', variant: 'destructive' },
  ditolak: { label: 'Ditolak', variant: 'destructive' },
  dibatalkan: { label: 'Dibatalkan', variant: 'slate' },
  boyong: { label: 'Boyong', variant: 'slate' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'slate' as const };

  return (
    <Badge variant={config.variant} className={cn("capitalize font-medium", className)}>
      {config.label}
    </Badge>
  );
}
