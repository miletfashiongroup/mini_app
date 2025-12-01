import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { CartPage } from '@/pages/cart/CartPage';
import { renderWithProviders } from '@/tests/renderWithProviders';

vi.mock('@/entities/cart/api/cartApi', () => ({
  cartKeys: { all: ['cart'] },
  fetchCart: vi.fn().mockResolvedValue({
    items: [
      {
        id: '1',
        product_name: 'Худи BRACE',
        size: '42-44',
        quantity: 1,
        unit_price_minor_units: 159100,
      },
      {
        id: '2',
        product_name: 'Футболка',
        size: '42-44',
        quantity: 1,
        unit_price_minor_units: 150000,
      },
    ],
    total_minor_units: 309100,
  }),
})));

describe('CartPage', () => {
  it('renders new cart layout', async () => {
    render(renderWithProviders(<CartPage />));

    expect(await screen.findByText('Корзина')).toBeInTheDocument();
    expect(screen.getByText('2 товара')).toBeInTheDocument();
    expect(screen.getByLabelText('Назад')).toBeInTheDocument();
    expect(screen.getByText('Итого')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'оформить заказ' })).toBeInTheDocument();

    expect(screen.getByLabelText('Домой')).toBeInTheDocument();
    expect(screen.getByLabelText('Сумка')).toBeInTheDocument();
    expect(screen.getByLabelText('Корзина')).toBeInTheDocument();
    expect(screen.getByLabelText('Профиль')).toBeInTheDocument();
  });
});
