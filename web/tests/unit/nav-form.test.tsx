import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { NavForm } from '@/components/nav-form';

// NavForm navigates on success; there is no Next router in jsdom.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// Radix's dialog uses browser APIs jsdom doesn't implement.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

afterEach(cleanup);

const CONFIRM = 'Delete this thing? This cannot be undone.';

function renderForm(action: (fd: FormData) => Promise<void>, confirm?: string) {
  return render(
    <NavForm action={action} confirm={confirm}>
      <button type="submit">Go</button>
    </NavForm>,
  );
}

describe('NavForm confirm flow', () => {
  it('runs the action immediately when there is no confirm', async () => {
    const action = vi.fn(async () => {});
    renderForm(action);
    fireEvent.click(screen.getByText('Go'));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });

  it('opens the dialog and does NOT run the action until confirmed', async () => {
    const action = vi.fn(async () => {});
    renderForm(action, CONFIRM);
    fireEvent.click(screen.getByText('Go'));
    // First sentence is the title, the rest the description.
    await screen.findByText('Delete this thing?');
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
    expect(action).not.toHaveBeenCalled();
  });

  it('cancel closes the dialog and never runs the action', async () => {
    const action = vi.fn(async () => {});
    renderForm(action, CONFIRM);
    fireEvent.click(screen.getByText('Go'));
    await screen.findByText('Delete this thing?');
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByText('Delete this thing?')).toBeNull());
    expect(action).not.toHaveBeenCalled();
  });

  it('confirm runs the action exactly once', async () => {
    const action = vi.fn(async () => {});
    renderForm(action, CONFIRM);
    fireEvent.click(screen.getByText('Go'));
    await screen.findByText('Delete this thing?');
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });
});
