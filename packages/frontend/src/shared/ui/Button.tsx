import { cva } from 'class-variance-authority';
import React from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const buttonStyles = cva(
  'inline-flex items-center justify-center rounded-[12px] font-semibold transition duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-white hover:bg-[#00005A] active:scale-[0.97]',
        secondary: 'bg-gray-100 text-text-primary hover:bg-gray-50 active:scale-[0.97]',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
);

export const Button = ({ className, variant = 'primary', ...rest }: ButtonProps) => {
  return <button className={twMerge(buttonStyles({ variant }), className)} {...rest} />;
};
