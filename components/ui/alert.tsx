import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[8px] border px-4 py-3 text-sm shadow-none [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:size-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(0,0,0,0.08)] bg-[#fbfbfa] text-[#111111] [&>svg]:text-[#111111]",
        destructive:
          "border-[#f9c5c0] bg-[#fdeeed] text-[#e32d14] [&>svg]:text-[#e32d14]",
        success:
          "border-[rgba(43,110,79,0.2)] bg-[#ebf5ee] text-[#2b6e4f] [&>svg]:text-[#2b6e4f]",
        warning:
          "border-[#fde2a7] bg-[#fff6e5] text-[#b47800] [&>svg]:text-[#b47800]",
        info:
          "border-[#bfe0fd] bg-[#e6f3fe] text-[#097fe8] [&>svg]:text-[#097fe8]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-heading font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
