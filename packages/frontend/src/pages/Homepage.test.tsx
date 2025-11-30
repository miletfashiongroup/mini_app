import { render, screen } from '@testing-library/react';

import { Homepage } from '@/pages/Homepage';
import { renderWithProviders } from '@/tests/renderWithProviders';

describe('Homepage', () => {
  it('renders key sections of the homepage design', () => {
    render(renderWithProviders(<Homepage />));

    expect(screen.getByText('Заголовок 1.1')).toBeInTheDocument();
    expect(screen.getByText('Заголовок 1.2')).toBeInTheDocument();
    expect(screen.getByText('Баннер')).toBeInTheDocument();
    expect(screen.getByText('Введите ваши данные, а мы подберем размер.')).toBeInTheDocument();
    expect(screen.getByText('перейти в каталог')).toBeInTheDocument();
  });
});
