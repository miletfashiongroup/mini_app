// packages/frontend/src/components/brace/Badge.tsx
import React from "react";
import clsx from "clsx";

type BadgeProps = {
  text?: string;
  color?: string;
  className?: string;
  children?: React.ReactNode;
};

export const Badge: React.FC<BadgeProps> = ({
  text,
  color = "bg-green-500",
  className,
  children,
}) => {
  const content = text ?? children;

  if (!content) return null;

  return (
    <span className={clsx("inline-block px-3 py-1 text-xs text-white rounded-full", color, className)}>
      {content}
    </span>
  );
};
