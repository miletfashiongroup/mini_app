import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { CartPage } from '@/pages/cart/CartPage';
import { renderWithProviders } from '@/tests/renderWithProviders';

vi.mock('@/entities/cart/api/cartApi', () => ({
  cartKeys: { all: ['cart'] },
  fetchCart: vi.fn().mockResolvedValue({
    items: [],
    total_minor_units: 0,
  }),
}));

vi.mock('@/features/order/create-order/model/useCreateOrderMutation', () => ({
  useCreateOrderMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    data: null,
    error: null,
  }),
}));

vi.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('CartPage', () => {
  it('renders empty cart state', async () => {
    render(renderWithProviders(<CartPage />));

    expect(await screen.findByText('Корзина')).toBeInTheDocument();
    expect(screen.getByText('Корзина пуста.')).toBeInTheDocument();
  });
});
