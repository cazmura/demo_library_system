import { Router } from 'express';
import { LoanError } from '../services/loanService.js';

export function loansRouter(loanService) {
  const router = Router();

  router.get('/', (req, res) => {
    res.json(loanService.listLoans());
  });

  router.post('/', (req, res) => {
    const { bookId, memberId } = req.body;
    if (!bookId || !memberId) {
      return res.status(400).json({ error: 'bookId and memberId are required' });
    }
    try {
      const loan = loanService.borrowBook({ bookId, memberId });
      res.status(201).json(loan);
    } catch (err) {
      if (err instanceof LoanError) {
        return res.status(err.status).json({ error: err.message });
      }
      throw err;
    }
  });

  router.post('/:id/return', (req, res) => {
    try {
      const loan = loanService.returnBook({ loanId: req.params.id });
      res.json(loan);
    } catch (err) {
      if (err instanceof LoanError) {
        return res.status(err.status).json({ error: err.message });
      }
      throw err;
    }
  });

  return router;
}
