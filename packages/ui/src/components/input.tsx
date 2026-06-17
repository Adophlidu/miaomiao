import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@miaomiao/ui/lib/utils";
import type * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-full border-2 border-transparent bg-surface-bright px-4 py-2 text-base text-on-surface transition-all outline-none placeholder:text-outline-variant focus-visible:border-primary-container disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
