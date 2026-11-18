import express from 'express';
import cors from 'cors';
import { booksRouter } from './routes/books.js';
import { membersRouter } from './routes/members.js';
import { loansRouter } from './routes/loans.js';
import { createLoanService } from './services/loanService.js';

export function createApp(db) {
  const app = express();
  const loanService = createLoanService(db);

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/books', booksRouter(db));
  app.use('/api/members', membersRouter(db));
  app.use('/api/loans', loansRouter(loanService));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
