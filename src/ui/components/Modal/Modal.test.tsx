import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders children when open and hides when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open={false} onClose={onClose} title="Hello">
        <p>body content</p>
      </Modal>,
    );
    expect(screen.queryByText('body content')).toBeNull();
    rerender(
      <Modal open={true} onClose={onClose} title="Hello">
        <p>body content</p>
      </Modal>,
    );
    expect(screen.getByText('body content')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="t">
        <button type="button">inner</button>
      </Modal>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="t">
        <p>body</p>
      </Modal>,
    );
    const backdrop = screen.getByTestId('modal-backdrop');
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="t">
        <p>body</p>
      </Modal>,
    );
    const closeBtn = screen.getByRole('button', { name: '닫기' });
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
