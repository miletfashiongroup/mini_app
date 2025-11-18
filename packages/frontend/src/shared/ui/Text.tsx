import clsx from 'clsx';

type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'overline';

const variantStyles: Record<TextVariant, string> = {
  display: 'text-3xl md:text-4xl font-semibold leading-tight',
  title: 'text-2xl font-semibold',
  subtitle: 'text-lg text-gray-dark/80',
  body: 'text-base',
  caption: 'text-sm text-gray-dark/70',
  overline: "text-[0.7rem] uppercase tracking-[0.3em] text-gray-dark/60 font-semibold",
};

export type TextProps<T extends React.ElementType = 'p'> = {
  as?: T;
  variant?: TextVariant;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export const Text = <T extends React.ElementType = 'p'>({
  as,
  variant = 'body',
  className,
  children,
  ...rest
}: TextProps<T>) => {
  const Component = as ?? ('p' as React.ElementType);
  return (
    <Component className={clsx(variantStyles[variant], className)} {...rest}>
      {children}
    </Component>
  );
};

