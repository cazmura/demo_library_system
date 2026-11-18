import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createDb } from '../../src/db.js';
import { createApp } from '../../src/app.js';

async function createBookAndMember(app) {
  const bookRes = await request(app)
    .post('/api/books')
    .send({ title: 'Dune', author: 'Frank Herbert', isbn: '111', totalCopies: 1 });
  const memberRes = await request(app)
    .post('/api/members')
    .send({ name: 'Alice', email: 'alice@example.com' });
  return { bookId: bookRes.body.id, memberId: memberRes.body.id };
}

describe('/api/loans', () => {
  let app;
  let db;

  beforeEach(() => {
    db = createDb();
    app = createApp(db);
  });

  it('borrows a book', async () => {
    const { bookId, memberId } = await createBookAndMember(app);
    const res = await request(app).post('/api/loans').send({ bookId, memberId });

    expect(res.status).toBe(201);
    expect(res.body.book_id).toBe(bookId);
    expect(res.body.returned_at).toBeNull();
  });

  it('rejects borrowing when no copies are available', async () => {
    const { bookId, memberId } = await createBookAndMember(app);
    await request(app).post('/api/loans').send({ bookId, memberId });

    const res = await request(app).post('/api/loans').send({ bookId, memberId });
    expect(res.status).toBe(409);
  });

  it('rejects borrowing a non-existent book', async () => {
    const { memberId } = await createBookAndMember(app);
    const res = await request(app).post('/api/loans').send({ bookId: 9999, memberId });
    expect(res.status).toBe(404);
  });

  it('returns a borrowed book', async () => {
    const { bookId, memberId } = await createBookAndMember(app);
    const borrowRes = await request(app).post('/api/loans').send({ bookId, memberId });

    const returnRes = await request(app).post(`/api/loans/${borrowRes.body.id}/return`);
    expect(returnRes.status).toBe(200);
    expect(returnRes.body.returned_at).not.toBeNull();

    const bookRes = await request(app).get(`/api/books/${bookId}`);
    expect(bookRes.body.available_copies).toBe(1);
  });

  it('rejects returning an already-returned loan', async () => {
    const { bookId, memberId } = await createBookAndMember(app);
    const borrowRes = await request(app).post('/api/loans').send({ bookId, memberId });
    await request(app).post(`/api/loans/${borrowRes.body.id}/return`);

    const secondReturn = await request(app).post(`/api/loans/${borrowRes.body.id}/return`);
    expect(secondReturn.status).toBe(409);
  });

  it('lists loans with book and member details', async () => {
    const { bookId, memberId } = await createBookAndMember(app);
    await request(app).post('/api/loans').send({ bookId, memberId });

    const res = await request(app).get('/api/loans');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ book_title: 'Dune', member_name: 'Alice' });
  });
});
