import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import type { Product } from '../types';

const fetchProduct = async (id: string): Promise<Product> => {
  const { data } = await client.get<Product>(`/products/${id}`);
  return data;
};

const useProduct = () => {
  const { id } = useParams();
  return useQuery({ queryKey: ['product', id], queryFn: () => fetchProduct(id || ''), enabled: !!id });
};

export default useProduct;
