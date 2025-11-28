// packages/frontend/src/components/brace/Card.tsx
import React from "react";
import clsx from "clsx";

type CardProps = {
  title?: string;
  children?: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ title, children, className }) => (
  <div className={clsx("bg-bg-muted rounded-card p-4 shadow-sm", className)}>
    {title && <h3 className="text-h3 font-bold text-text-base mb-2">{title}</h3>}
    {children}
  </div>
);
