import { render, screen } from '@testing-library/react';

import { Homepage } from '@/pages/Homepage';
import { renderWithProviders } from '@/tests/renderWithProviders';

describe('Homepage', () => {
  it('renders key sections', () => {
    render(renderWithProviders(<Homepage />));

    expect(screen.getByText('Systems v1')).toBeInTheDocument();
    expect(screen.getByText('Detections v1')).toBeInTheDocument();
  });
});
