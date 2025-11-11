import { useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

const useOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => client.post('/orders', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export default useOrder;
