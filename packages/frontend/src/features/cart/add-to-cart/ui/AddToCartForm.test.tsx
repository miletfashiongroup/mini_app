import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { vi } from 'vitest';

import type { Product } from '@/entities/product/model/types';
import { useProductSelectionStore } from '@/shared/state/productSelectionStore';

import { AddToCartForm } from './AddToCartForm';

const mutateMock = vi.fn();

vi.mock('../model/useAddToCartMutation', () => ({
  useAddToCartMutation: () => ({
    mutate: mutateMock,
    isPending: false,
    isError: false,
  }),
}));

const product: Product = {
  id: 'product-1',
  name: 'BRACE Essential',
  description: 'Test',
  hero_media_url: 'https://example.com/image.jpg',
  created_at: '',
  updated_at: '',
  variants: [
    { id: 'v1', size: 'M', price_minor_units: 10000, stock: 10 },
    { id: 'v2', size: 'L', price_minor_units: 11000, stock: 5 },
  ],
};

describe('AddToCartForm', () => {
  const user = userEvent.setup();

  afterEach(() => {
    mutateMock.mockClear();
    useProductSelectionStore.getState().resetAll();
  });

  it('submits selected size and quantity', async () => {
    render(<AddToCartForm product={product} />);
    await act(async () => {});

    await user.click(screen.getByText('L'));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: /Добавить в корзину/i }));
    await act(async () => {});

    expect(mutateMock).toHaveBeenCalledWith({
      product_id: product.id,
      size: 'L',
      quantity: 2,
    });
  });
});
