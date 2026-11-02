import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0F5132] text-white shadow hover:bg-[#0B3D26]",
        secondary:
          "border-[#A7F3D0] bg-[#ECFDF5] text-[#064E3B] hover:bg-[#D1FAE5]",
        warning:
          "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
        destructive:
          "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]",
        outline:
          "text-[#0F172A] border-[#E2E8F0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
