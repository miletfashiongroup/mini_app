import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import type { CartResponseItem } from '../types';

const fetchCart = async (): Promise<CartResponseItem[]> => {
  const { data } = await client.get<{ items: CartResponseItem[] }>('/cart');
  return data.items;
};

export const useCart = () => {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['cart'], queryFn: fetchCart });

  const add = useMutation({
    mutationFn: (payload: { product_id: string; size: string; quantity: number }) =>
      client.post('/cart', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => client.delete(`/cart/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  return { ...query, add, remove };
};
