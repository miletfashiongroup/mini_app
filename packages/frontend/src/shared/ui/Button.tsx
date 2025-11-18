import clsx from 'clsx';
import { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-dark text-white hover:bg-blue-dark/90 focus-visible:outline-blue-dark data-[state=loading]:cursor-wait',
  secondary:
    'bg-white text-blue-dark hover:bg-gray-light focus-visible:outline-blue-dark border border-gray-light',
  ghost:
    'bg-transparent text-current hover:bg-white/10 border border-transparent focus-visible:outline-blue-dark',
};

const sizeStyles: Record<ButtonSize, string> = {
  md: 'px-5 py-2 text-sm rounded-2xl',
  lg: 'px-6 py-3 text-base rounded-3xl',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
});

