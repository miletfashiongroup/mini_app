// packages/frontend/src/components/brace/Button.tsx
import clsx from "clsx";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  className?: string;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}) => {
  const base = "text-sm font-medium px-6 py-2 rounded-button transition";
  const styles = {
    primary: "bg-accent text-white hover:bg-opacity-90",
    outline: "border border-accent text-accent hover:bg-accent hover:text-white",
  };

  return (
    <button
      type={type}
      className={clsx(base, styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};
