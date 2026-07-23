import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "flex h-12 w-full rounded-xl border-2 border-border bg-surface px-4 py-2 text-sm text-text transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:border-brand-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus-visible:border-error",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-error font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
