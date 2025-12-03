import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Modal } from '@/shared/ui/Modal';

describe('Modal', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen title="Title" onClose={() => undefined}>
        content
      </Modal>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { queryByText } = render(
      <Modal isOpen={false} title="Hidden" onClose={() => undefined}>
        content
      </Modal>,
    );
    expect(queryByText('Hidden')).toBeNull();
  });
});
