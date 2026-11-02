import React from 'react';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/formatters';

interface CurrencyDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number | bigint;
  showSign?: boolean;
  prefix?: string;
}

export function CurrencyDisplay({
  amount,
  showSign = false,
  prefix,
  className,
  ...props
}: CurrencyDisplayProps) {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  const formatted = formatRupiah(Math.abs(num));
  const isNegative = num < 0;

  return (
    <span
      className={cn(
        "font-mono tracking-tight font-medium inline-flex items-center",
        isNegative ? "text-[#DC2626]" : "text-[#0F172A]",
        className
      )}
      {...props}
    >
      {isNegative ? "- " : showSign && num > 0 ? "+ " : ""}
      {prefix ? `${prefix} ` : ""}
      {formatted}
    </span>
  );
}
