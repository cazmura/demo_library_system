import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BooksPage from '../src/pages/BooksPage.jsx';

const books = [
  { id: 1, title: 'Dune', author: 'Frank Herbert', isbn: '111', total_copies: 2, available_copies: 1 },
  { id: 2, title: 'Foundation', author: 'Isaac Asimov', isbn: '222', total_copies: 1, available_copies: 0 },
];
const members = [{ id: 1, name: 'Alice', email: 'alice@example.com' }];

function mockFetchResponses(responses) {
  let call = 0;
  global.fetch = vi.fn(() => {
    const response = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return Promise.resolve({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve(response),
    });
  });
}

describe('BooksPage', () => {
  beforeEach(() => {
    mockFetchResponses([books, members]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the list of books', async () => {
    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('disables the borrow button when there are no available copies', async () => {
    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>
    );

    await screen.findByText('Foundation');
    const rows = screen.getAllByRole('row');
    const foundationRow = rows.find((r) => r.textContent.includes('Foundation'));
    const borrowButton = foundationRow.querySelector('button');
    expect(borrowButton).toBeDisabled();
  });

  it('shows a validation error when borrowing without selecting a member', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BooksPage />
      </MemoryRouter>
    );

    await screen.findByText('Dune');
    const buttons = screen.getAllByText('貸出');
    await user.click(buttons[0]);

    expect(await screen.findByText('貸出先の会員を選択してください')).toBeInTheDocument();
  });
});
