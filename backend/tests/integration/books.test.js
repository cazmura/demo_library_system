import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createDb } from '../../src/db.js';
import { createApp } from '../../src/app.js';

describe('/api/books', () => {
  let app;
  let db;

  beforeEach(() => {
    db = createDb();
    app = createApp(db);
  });

  it('returns an empty list when there are no books', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('creates a book', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Dune', author: 'Frank Herbert', isbn: '978-0-441-17271-9', totalCopies: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Dune',
      author: 'Frank Herbert',
      total_copies: 2,
      available_copies: 2,
    });
  });

  it('rejects a book missing required fields', async () => {
    const res = await request(app).post('/api/books').send({ title: 'Dune' });
    expect(res.status).toBe(400);
  });

  it('rejects a duplicate ISBN', async () => {
    const book = { title: 'Dune', author: 'Frank Herbert', isbn: '978-0-441-17271-9' };
    await request(app).post('/api/books').send(book);
    const res = await request(app).post('/api/books').send(book);
    expect(res.status).toBe(409);
  });

  it('filters books by search query', async () => {
    await request(app).post('/api/books').send({ title: 'Dune', author: 'Frank Herbert', isbn: '111' });
    await request(app).post('/api/books').send({ title: 'Foundation', author: 'Isaac Asimov', isbn: '222' });

    const res = await request(app).get('/api/books?q=dune');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Dune');
  });

  it('returns 404 for a book that does not exist', async () => {
    const res = await request(app).get('/api/books/999');
    expect(res.status).toBe(404);
  });

  it('refuses to delete a book that is currently on loan', async () => {
    const bookRes = await request(app)
      .post('/api/books')
      .send({ title: 'Dune', author: 'Frank Herbert', isbn: '111', totalCopies: 1 });
    const memberRes = await request(app)
      .post('/api/members')
      .send({ name: 'Alice', email: 'alice@example.com' });

    await request(app)
      .post('/api/loans')
      .send({ bookId: bookRes.body.id, memberId: memberRes.body.id });

    const deleteRes = await request(app).delete(`/api/books/${bookRes.body.id}`);
    expect(deleteRes.status).toBe(409);
  });
});
