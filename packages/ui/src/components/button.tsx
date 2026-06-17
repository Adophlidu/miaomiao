import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@miaomiao/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-display font-semibold whitespace-nowrap transition-all outline-none select-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary-container text-white soft-shadow hover:opacity-90",
        outline:
          "border-2 border-outline-variant bg-surface-bright text-on-surface hover:bg-surface-container",
        secondary: "bg-secondary-container text-on-secondary-container hover:opacity-90",
        ghost: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
        destructive: "bg-error/10 text-error hover:bg-error/20",
        link: "text-primary-container underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 gap-2 px-6 text-base",
        xs: "h-8 gap-1 px-3 text-sm",
        sm: "h-9 gap-1.5 px-4 text-sm",
        lg: "h-14 gap-2 px-8 text-lg",
        icon: "size-12",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
