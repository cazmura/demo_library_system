import { Router } from 'express';
import { isUniqueConstraintError } from '../db.js';

export function membersRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const members = db.prepare('SELECT * FROM members ORDER BY name').all();
    res.json(members);
  });

  router.get('/:id', (req, res) => {
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  });

  router.post('/', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    try {
      const result = db.prepare('INSERT INTO members (name, email) VALUES (?, ?)').run(name, email);
      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(member);
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        return res.status(409).json({ error: 'A member with this email already exists' });
      }
      throw err;
    }
  });

  return router;
}
