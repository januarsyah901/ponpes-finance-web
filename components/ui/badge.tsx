import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#0075de] focus:ring-offset-2 shadow-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#0075de] text-white shadow-none hover:bg-[#0060b8]",
        secondary:
          "border-[#bfe0fd] bg-[#e6f3fe] text-[#097fe8] hover:bg-[#d5ebfd]",
        success:
          "border-[rgba(43,110,79,0.2)] bg-[#ebf5ee] text-[#2b6e4f] hover:bg-[#dff0e4]",
        warning:
          "border-[#fde2a7] bg-[#fff6e5] text-[#b47800] hover:bg-[#ffeed0]",
        destructive:
          "border-[#f9c5c0] bg-[#fdeeed] text-[#e32d14] hover:bg-[#fbdcd9]",
        outline:
          "border-[rgba(0,0,0,0.1)] bg-white text-[#5a5a58] hover:bg-[#f6f5f4]",
        slate:
          "border-[rgba(90,90,88,0.2)] bg-[#f1f1ef] text-[#5a5a58] hover:bg-[#e8e8e6]",
        sky:
          "border-[#bfe0fd] bg-[#e6f3fe] text-[#097fe8] hover:bg-[#d5ebfd]",
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
