import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[18px] border px-4 py-3 text-sm shadow-none [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:size-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "border-[#E8E8E8] bg-[#F5F5F5] text-[#202119] [&>svg]:text-[#202119]",
        destructive:
          "border-[rgba(200,76,90,0.2)] bg-[#FCEDEF] text-[#C84C5A] [&>svg]:text-[#C84C5A]",
        success:
          "border-[rgba(43,138,96,0.2)] bg-[#EAF7EF] text-[#2B8A60] [&>svg]:text-[#2B8A60]",
        warning:
          "border-[rgba(194,65,12,0.2)] bg-[#FFF7ED] text-[#C2410C] [&>svg]:text-[#C2410C]",
        info:
          "border-[rgba(49,95,196,0.2)] bg-[#EDF2FB] text-[#315FC4] [&>svg]:text-[#315FC4]",
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
