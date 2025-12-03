import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ToastProvider } from '@/shared/components/ToastProvider';
import { useToast } from '@/shared/hooks/useToast';

const TestComponent = () => {
  const toast = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.success('Success message')}>
        Success
      </button>
      <button type="button" onClick={() => toast.error('Error occurred')}>
        Error
      </button>
    </div>
  );
};

describe('ToastProvider', () => {
  it('shows and hides toast messages', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await act(async () => {
        await user.click(screen.getByText('Success'));
      });

      expect(await screen.findByText('Success message')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.queryByText('Success message')).not.toBeInTheDocument();
        },
        { timeout: 6000 },
      );
    },
    10000,
  );

  it('renders error toast on click', async () => {
      const user = userEvent.setup();

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>,
      );

      await act(async () => {
        await user.click(screen.getByText('Error'));
      });

      expect(await screen.findByText('Error occurred')).toBeInTheDocument();
    },
    10000,
  );
});
