import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../../src/db.js';
import { createLoanService, LoanError } from '../../src/services/loanService.js';

describe('loanService', () => {
  let db;
  let loanService;
  const fixedNow = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    db = createDb();
    db.prepare(
      'INSERT INTO books (id, title, author, isbn, total_copies, available_copies) VALUES (1, ?, ?, ?, ?, ?)'
    ).run('Test Book', 'Test Author', '000-0', 1, 1);
    db.prepare('INSERT INTO members (id, name, email) VALUES (1, ?, ?)').run('Alice', 'alice@example.com');
    loanService = createLoanService(db, { now: () => fixedNow });
  });

  it('borrows a book and decrements available copies', () => {
    const loan = loanService.borrowBook({ bookId: 1, memberId: 1 });
    expect(loan.book_id).toBe(1);
    expect(loan.member_id).toBe(1);
    expect(loan.returned_at).toBeNull();

    const book = db.prepare('SELECT * FROM books WHERE id = 1').get();
    expect(book.available_copies).toBe(0);
  });

  it('sets the due date 14 days after borrowing', () => {
    const loan = loanService.borrowBook({ bookId: 1, memberId: 1 });
    const due = new Date(loan.due_at);
    const expected = new Date('2026-01-15T00:00:00.000Z');
    expect(due.getTime()).toBe(expected.getTime());
  });

  it('throws when borrowing a book with no available copies', () => {
    loanService.borrowBook({ bookId: 1, memberId: 1 });
    expect(() => loanService.borrowBook({ bookId: 1, memberId: 1 })).toThrow(LoanError);
  });

  it('throws when the book does not exist', () => {
    expect(() => loanService.borrowBook({ bookId: 999, memberId: 1 })).toThrow('Book not found');
  });

  it('throws when the member does not exist', () => {
    expect(() => loanService.borrowBook({ bookId: 1, memberId: 999 })).toThrow('Member not found');
  });

  it('returns a book and increments available copies', () => {
    const loan = loanService.borrowBook({ bookId: 1, memberId: 1 });
    const returned = loanService.returnBook({ loanId: loan.id });
    expect(returned.returned_at).not.toBeNull();

    const book = db.prepare('SELECT * FROM books WHERE id = 1').get();
    expect(book.available_copies).toBe(1);
  });

  it('throws when returning a loan that was already returned', () => {
    const loan = loanService.borrowBook({ bookId: 1, memberId: 1 });
    loanService.returnBook({ loanId: loan.id });
    expect(() => loanService.returnBook({ loanId: loan.id })).toThrow('already been returned');
  });

  it('throws when returning a loan that does not exist', () => {
    expect(() => loanService.returnBook({ loanId: 999 })).toThrow('Loan not found');
  });

  it('flags a loan as overdue once the due date has passed', () => {
    const loan = loanService.borrowBook({ bookId: 1, memberId: 1 });
    const afterDue = new Date('2026-01-16T00:00:00.000Z');
    expect(loanService.isOverdue(loan, afterDue)).toBe(true);
    expect(loanService.isOverdue(loan, fixedNow)).toBe(false);
  });

  it('never flags a returned loan as overdue', () => {
    const loan = loanService.borrowBook({ bookId: 1, memberId: 1 });
    const returned = loanService.returnBook({ loanId: loan.id });
    const farFuture = new Date('2030-01-01T00:00:00.000Z');
    expect(loanService.isOverdue(returned, farFuture)).toBe(false);
  });

  describe('loan limit per member', () => {
    beforeEach(() => {
      db.prepare('UPDATE books SET total_copies = 5, available_copies = 5 WHERE id = 1').run();
    });

    it('allows up to 3 active loans per member', () => {
      for (let i = 0; i < 3; i += 1) {
        loanService.borrowBook({ bookId: 1, memberId: 1 });
      }
      const active = db
        .prepare('SELECT COUNT(*) AS count FROM loans WHERE member_id = 1 AND returned_at IS NULL')
        .get();
      expect(active.count).toBe(3);
    });

    it('rejects the 4th active loan and keeps available copies unchanged', () => {
      for (let i = 0; i < 3; i += 1) {
        loanService.borrowBook({ bookId: 1, memberId: 1 });
      }
      expect(() => loanService.borrowBook({ bookId: 1, memberId: 1 })).toThrow(
        '貸出上限（3冊）に達しているため貸し出せません'
      );
      const book = db.prepare('SELECT * FROM books WHERE id = 1').get();
      expect(book.available_copies).toBe(2);
    });

    it('allows borrowing again after a return', () => {
      const loans = [];
      for (let i = 0; i < 3; i += 1) {
        loans.push(loanService.borrowBook({ bookId: 1, memberId: 1 }));
      }
      loanService.returnBook({ loanId: loans[0].id });
      expect(() => loanService.borrowBook({ bookId: 1, memberId: 1 })).not.toThrow();
    });

    it('counts the limit per member', () => {
      db.prepare('INSERT INTO members (id, name, email) VALUES (2, ?, ?)').run('Bob', 'bob@example.com');
      for (let i = 0; i < 3; i += 1) {
        loanService.borrowBook({ bookId: 1, memberId: 1 });
      }
      expect(() => loanService.borrowBook({ bookId: 1, memberId: 2 })).not.toThrow();
    });
  });
});
