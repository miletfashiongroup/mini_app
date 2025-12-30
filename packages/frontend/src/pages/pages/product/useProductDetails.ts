import { useProductQuery } from '@/shared/api/queries';

export const useProductDetails = (productId?: string) => {
  return useProductQuery(productId ?? '', {
    enabled: Boolean(productId),
  });
};
