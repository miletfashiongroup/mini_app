import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cartKeys, deleteCartItem } from '@/entities/cart/api/cartApi';

type Props = {
  itemId: string;
};

export const RemoveCartItemButton = ({ itemId }: Props) => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteCartItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
  });

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        mutation.mutate();
      }}
      className="text-slate-400 text-sm"
      disabled={mutation.isPending}
    >
      Удалить
    </button>
  );
};
