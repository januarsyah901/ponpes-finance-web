import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315FC4] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#202119] text-white shadow-none hover:bg-[#2e2f26] active:bg-[#181913]",
        destructive:
          "bg-[#C84C5A] text-white shadow-none hover:bg-[#b03d4a] active:bg-[#9e3541]",
        outline:
          "border border-[#E8E8E8] bg-white text-[#202119] shadow-none hover:bg-[#F5F5F5] hover:text-[#202119]",
        secondary:
          "bg-[#F5F5F5] text-[#202119] border border-[#E8E8E8] shadow-none hover:bg-[#EAEAEA]",
        ghost:
          "text-[#202119] hover:bg-[#F5F5F5] hover:text-[#202119] rounded-[8px]",
        link:
          "text-[#202119] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[8px] px-3 text-xs",
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
