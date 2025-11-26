import { ProductGrid as BraceProductGrid } from '@/components/brace';
import { useProductsQuery } from '@/shared/api/queries';

export const ProductGrid = () => {
  const { data, isLoading, isError, refetch } = useProductsQuery();

  return (
    <BraceProductGrid
      products={data?.items ?? []}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
    />
  );
};
