import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import type { Product } from '../types';

const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await client.get<{ items: Product[] }>('/products');
  return data.items;
};

const useProducts = () => useQuery({ queryKey: ['products'], queryFn: fetchProducts });

export default useProducts;
