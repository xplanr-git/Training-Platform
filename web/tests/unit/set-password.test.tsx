import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

/**
 * The invitee's first screen must not open by telling them they are too late.
 *
 * `hasSession` starts false, so the card description rendered "This link is no
 * longer valid." for the whole of the session check — a full JS download plus an
 * auth round trip — directly beneath the heading "Choose a password". The failure
 * copy is now shown only once the check has come back and actually failed.
 */
const getUser = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { getUser } }),
}));

const { default: SetPasswordPage } = await import('@/app/auth/set-password/page');

afterEach(() => {
  cleanup();
  getUser.mockReset();
});

const INVALID = /no longer valid/i;
const OPTIMISTIC = /set a password so you can sign in/i;

describe('set-password does not cry wolf while it checks', () => {
  it('shows the normal copy while the session check is in flight', async () => {
    // Never resolves: this is the state the user actually sat in.
    getUser.mockReturnValue(new Promise(() => {}));
    render(<SetPasswordPage />);

    expect(screen.queryByText(INVALID)).toBeNull();
    expect(screen.getByText(OPTIMISTIC)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toMatch(/checking your link/i);
  });

  it('shows the form once a session is confirmed', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    render(<SetPasswordPage />);

    await waitFor(() => expect(screen.getByLabelText(/new password/i)).toBeTruthy());
    expect(screen.queryByText(INVALID)).toBeNull();
  });

  it('only says the link is invalid after the check comes back empty', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    render(<SetPasswordPage />);

    await waitFor(() => expect(screen.getByText(INVALID)).toBeTruthy());
    // ...and still offers a way forward rather than being a dead end.
    expect(screen.getByRole('link', { name: /send me a new link/i }).getAttribute('href')).toBe(
      '/login/forgot',
    );
  });
});
