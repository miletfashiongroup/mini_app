type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
);
