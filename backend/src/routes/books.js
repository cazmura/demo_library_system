import { Router } from 'express';
import { isUniqueConstraintError } from '../db.js';

export function booksRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { q } = req.query;
    let books;
    if (q) {
      const like = `%${q}%`;
      books = db
        .prepare('SELECT * FROM books WHERE title LIKE ? OR author LIKE ? ORDER BY title')
        .all(like, like);
    } else {
      books = db.prepare('SELECT * FROM books ORDER BY title').all();
    }
    res.json(books);
  });

  router.get('/:id', (req, res) => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  });

  router.post('/', (req, res) => {
    const { title, author, isbn, totalCopies } = req.body;
    if (!title || !author || !isbn) {
      return res.status(400).json({ error: 'title, author and isbn are required' });
    }
    const copies = Number.isInteger(totalCopies) && totalCopies > 0 ? totalCopies : 1;
    try {
      const result = db
        .prepare(
          'INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)'
        )
        .run(title, author, isbn, copies, copies);
      const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(book);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return res.status(409).json({ error: 'A book with this ISBN already exists' });
      }
      throw err;
    }
  });

  router.delete('/:id', (req, res) => {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const activeLoan = db
      .prepare('SELECT * FROM loans WHERE book_id = ? AND returned_at IS NULL')
      .get(req.params.id);
    if (activeLoan) {
      return res.status(409).json({ error: 'Cannot delete a book that is currently on loan' });
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    res.status(204).send();
  });

  return router;
}
