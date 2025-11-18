import clsx from 'clsx';
import { forwardRef } from 'react';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  block?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, block = true, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={clsx(
        'rounded-2xl border border-gray-light bg-white/80 px-4 py-3 text-sm text-gray-dark placeholder:text-gray-dark/60 focus:border-blue-dark focus-visible:outline-blue-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60',
        block && 'w-full',
        className,
      )}
      {...props}
    />
  );
});

