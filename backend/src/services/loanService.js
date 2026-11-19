const LOAN_PERIOD_DAYS = 14;
const MAX_ACTIVE_LOANS_PER_MEMBER = 3;

export class LoanError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function createLoanService(db, { now = () => new Date() } = {}) {
  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function borrowBook({ bookId, memberId }) {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
    if (!book) throw new LoanError('Book not found', 404);

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!member) throw new LoanError('Member not found', 404);

    if (book.available_copies < 1) {
      throw new LoanError('No available copies of this book', 409);
    }

    const { count: activeLoans } = db
      .prepare('SELECT COUNT(*) AS count FROM loans WHERE member_id = ? AND returned_at IS NULL')
      .get(memberId);
    if (activeLoans >= MAX_ACTIVE_LOANS_PER_MEMBER) {
      throw new LoanError(
        `貸出上限（${MAX_ACTIVE_LOANS_PER_MEMBER}冊）に達しているため貸し出せません`,
        409
      );
    }

    const borrowedAt = now();
    const dueAt = addDays(borrowedAt, LOAN_PERIOD_DAYS);

    const insert = db.prepare(
      `INSERT INTO loans (book_id, member_id, borrowed_at, due_at, returned_at)
       VALUES (?, ?, ?, ?, NULL)`
    );
    const result = insert.run(bookId, memberId, borrowedAt.toISOString(), dueAt.toISOString());

    db.prepare('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?').run(bookId);

    return db.prepare('SELECT * FROM loans WHERE id = ?').get(result.lastInsertRowid);
  }

  function returnBook({ loanId }) {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
    if (!loan) throw new LoanError('Loan not found', 404);
    if (loan.returned_at) throw new LoanError('This loan has already been returned', 409);

    const returnedAt = now().toISOString();
    db.prepare('UPDATE loans SET returned_at = ? WHERE id = ?').run(returnedAt, loanId);
    db.prepare('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?').run(loan.book_id);

    return db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
  }

  function isOverdue(loan, reference = now()) {
    if (loan.returned_at) return false;
    return new Date(loan.due_at).getTime() < reference.getTime();
  }

  function listLoans() {
    const loans = db
      .prepare(
        `SELECT loans.*, books.title AS book_title, members.name AS member_name
         FROM loans
         JOIN books ON books.id = loans.book_id
         JOIN members ON members.id = loans.member_id
         ORDER BY loans.borrowed_at DESC`
      )
      .all();
    return loans.map((loan) => ({ ...loan, overdue: isOverdue(loan) }));
  }

  return {
    borrowBook,
    returnBook,
    listLoans,
    isOverdue,
    LOAN_PERIOD_DAYS,
    MAX_ACTIVE_LOANS_PER_MEMBER,
  };
}
