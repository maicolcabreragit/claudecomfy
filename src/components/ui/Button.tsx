"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-fast ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-surface-elevated border border-surface-border text-foreground hover:bg-surface-overlay hover:border-accent-purple/30",
        primary:
          "bg-accent-purple text-white hover:bg-accent-purple/90 shadow-glow-purple-sm hover:shadow-glow-purple-md",
        ghost:
          "hover:bg-surface-elevated text-zinc-400 hover:text-foreground",
        destructive:
          "bg-semantic-error text-white hover:bg-semantic-error/90",
        outline:
          "border border-surface-border bg-transparent hover:bg-surface-elevated text-foreground",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-lg",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : LeftIcon ? (
          <LeftIcon className="h-4 w-4" />
        ) : null}
        {children}
        {RightIcon && !isLoading && <RightIcon className="h-4 w-4" />}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
