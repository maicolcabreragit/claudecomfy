"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  // Base styles
  "flex w-full transition-all duration-fast ease-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-surface-border bg-surface-base text-foreground focus-visible:ring-2 focus-visible:ring-accent-purple/50 focus-visible:border-accent-purple/50",
        ghost:
          "border-transparent bg-transparent hover:bg-surface-elevated focus-visible:bg-surface-elevated text-foreground",
      },
      inputSize: {
        sm: "h-8 px-3 text-xs rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-4 text-base rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      error,
      helperText,
      ...props
    },
    ref
  ) => {
    const hasLeftIcon = !!LeftIcon;
    const hasRightIcon = !!RightIcon;

    return (
      <div className="w-full">
        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <LeftIcon className="h-4 w-4" />
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize }),
              hasLeftIcon && "pl-10",
              hasRightIcon && "pr-10",
              error && "border-semantic-error focus-visible:ring-semantic-error/50",
              className
            )}
            ref={ref}
            {...props}
          />
          {RightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <RightIcon className="h-4 w-4" />
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              "mt-1.5 text-xs",
              error ? "text-semantic-error" : "text-zinc-500"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
