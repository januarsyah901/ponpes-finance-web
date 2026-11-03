import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#315FC4] focus:ring-offset-2 shadow-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#202119] text-white shadow-none hover:bg-[#2e2f26]",
        secondary:
          "border-[#E8E8E8] bg-[#F5F5F5] text-[#626262] hover:bg-[#EAEAEA]",
        success:
          "border-[rgba(43,138,96,0.2)] bg-[#EAF7EF] text-[#2B8A60] hover:bg-[#ddf2e4]",
        warning:
          "border-[rgba(194,65,12,0.2)] bg-[#FFF7ED] text-[#C2410C] hover:bg-[#ffedd5]",
        destructive:
          "border-[rgba(200,76,90,0.2)] bg-[#FCEDEF] text-[#C84C5A] hover:bg-[#f8dada]",
        outline:
          "border-[#E8E8E8] bg-white text-[#626262] hover:bg-[#F5F5F5]",
        slate:
          "border-[#E8E8E8] bg-[#F5F5F5] text-[#626262] hover:bg-[#EAEAEA]",
        sky:
          "border-[rgba(49,95,196,0.2)] bg-[#EDF2FB] text-[#315FC4] hover:bg-[#dce6f7]",
        orange:
          "border-[rgba(244,81,42,0.2)] bg-[#FFF0ED] text-[#F4512A] hover:bg-[#ffe5df]",
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
