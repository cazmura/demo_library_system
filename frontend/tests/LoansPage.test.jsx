import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoansPage from '../src/pages/LoansPage.jsx';

const loans = [
  {
    id: 1,
    book_title: 'Dune',
    member_name: 'Alice',
    borrowed_at: '2026-01-01T00:00:00.000Z',
    due_at: '2026-01-15T00:00:00.000Z',
    returned_at: null,
    overdue: true,
  },
  {
    id: 2,
    book_title: 'Foundation',
    member_name: 'Bob',
    borrowed_at: '2025-12-01T00:00:00.000Z',
    due_at: '2025-12-15T00:00:00.000Z',
    returned_at: '2025-12-10T00:00:00.000Z',
    overdue: false,
  },
];

describe('LoansPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('separates active and returned loans, and flags overdue loans', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(loans),
      })
    );

    render(
      <MemoryRouter>
        <LoansPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('延滞')).toBeInTheDocument();
    expect(screen.getAllByText('Dune')).toHaveLength(1);
    expect(screen.getAllByText('Foundation')).toHaveLength(1);
  });
});
