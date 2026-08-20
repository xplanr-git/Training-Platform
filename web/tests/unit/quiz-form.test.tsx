import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';

/**
 * The knowledge-check interaction model (cohort-release §5). One question at a
 * time; a quiet Back on the LEFT and the single primary (Next → / Finish check)
 * on the RIGHT; the primary is disabled until an answer is picked; a selection
 * persists across Back; there is no per-question "Check answer" step. These are
 * the exact behaviours the spec asked to confirm, so they are pinned here.
 */

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));

const { QuizForm } = await import('@/components/quiz-form');

const QUESTIONS = [
  { id: 'q1', prompt: 'Which bracket is the A201?', type: 'mcq', options: ['A', 'B', 'C'] },
  { id: 'q2', prompt: 'When is a critical connection used?', type: 'mcq', options: ['X', 'Y'] },
];

afterEach(() => cleanup());
beforeEach(() => push.mockReset());

function primary(): HTMLButtonElement {
  // The one primary action: "Next" until the last question, then "Finish check".
  return (screen.queryByRole('button', { name: /finish check/i }) ??
    screen.getByRole('button', { name: /^next/i })) as HTMLButtonElement;
}

describe('QuizForm interaction model', () => {
  it('starts on Q1 with no Back, and the primary disabled until a pick', () => {
    render(<QuizForm questions={QUESTIONS} submitAction={vi.fn()} />);
    expect(screen.getByText('Question 1 of 2')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /back/i })).toBeNull();
    expect(primary().disabled).toBe(true);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    expect(primary().disabled).toBe(false);
  });

  it('Back sits to the LEFT of the primary (Back precedes it in the DOM)', () => {
    render(<QuizForm questions={QUESTIONS} submitAction={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(primary()); // advance to Q2 so Back exists
    const back = screen.getByRole('button', { name: /back/i });
    const fin = screen.getByRole('button', { name: /finish check/i });
    // A quiet secondary on the left: earlier in document order than the primary.
    expect(back.compareDocumentPosition(fin) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(back.className).toContain('mr-auto');
  });

  it('a selection persists across Back and can be changed', () => {
    render(<QuizForm questions={QUESTIONS} submitAction={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('radio')[1]); // pick B on Q1
    fireEvent.click(primary()); // → Q2
    fireEvent.click(screen.getByRole('button', { name: /back/i })); // ← Q1
    expect(screen.getByText('Question 1 of 2')).toBeTruthy();
    const radios = screen.getAllByRole('radio') as HTMLInputElement[];
    expect(radios[1].checked).toBe(true); // still B
    fireEvent.click(radios[0]); // change to A
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
  });

  it('there is no per-question "Check answer" step', () => {
    render(<QuizForm questions={QUESTIONS} submitAction={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /check answer/i })).toBeNull();
  });

  it('Finish submits every selection and navigates to the returned target', async () => {
    const submitAction = vi.fn().mockResolvedValue({ redirectTo: '/learn/x/q1' });
    render(<QuizForm questions={QUESTIONS} submitAction={submitAction} />);
    fireEvent.click(screen.getAllByRole('radio')[0]); // Q1 = A (index 0)
    fireEvent.click(primary()); // → Q2
    fireEvent.click(screen.getAllByRole('radio')[1]); // Q2 = Y (index 1)
    fireEvent.click(screen.getByRole('button', { name: /finish check/i }));
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    const fd = submitAction.mock.calls[0][0] as FormData;
    expect(fd.getAll('q_q1')).toEqual(['0']);
    expect(fd.getAll('q_q2')).toEqual(['1']);
    await waitFor(() => expect(push).toHaveBeenCalledWith('/learn/x/q1'));
  });

  it('a returned { error } is shown and no navigation happens', async () => {
    const submitAction = vi.fn().mockResolvedValue({ error: 'You have used all attempts.' });
    render(<QuizForm questions={[QUESTIONS[0]]} submitAction={submitAction} />);
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByRole('button', { name: /finish check/i }));
    await waitFor(() => expect(screen.getByText(/used all attempts/i)).toBeTruthy());
    expect(push).not.toHaveBeenCalled();
  });
});
