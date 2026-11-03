import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0075de] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#0075de] text-white shadow-none hover:bg-[#0060b8] active:bg-[#004f94]",
        destructive:
          "bg-[#f64932] text-white shadow-none hover:bg-[#e32d14] active:bg-[#c0382b]",
        outline:
          "border border-[rgba(0,0,0,0.12)] bg-white text-[#111111] shadow-none hover:bg-[#f6f5f4] hover:text-[#111111]",
        secondary:
          "bg-[#e6f3fe] text-[#0075de] border border-[rgba(0,117,222,0.2)] shadow-none hover:bg-[#d5ebfd]",
        ghost:
          "text-[#111111] hover:bg-[rgba(55,53,47,0.06)] hover:text-[#111111]",
        link:
          "text-[#0075de] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[6px] px-3 text-xs",
        lg: "h-11 rounded-[8px] px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
