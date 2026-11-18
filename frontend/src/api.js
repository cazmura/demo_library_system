const BASE_URL = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(body?.error || `Request failed with status ${res.status}`);
  }
  return body;
}

export const api = {
  getBooks: (query = '') => request(`/books${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  getBook: (id) => request(`/books/${id}`),
  createBook: (data) => request('/books', { method: 'POST', body: JSON.stringify(data) }),
  deleteBook: (id) => request(`/books/${id}`, { method: 'DELETE' }),

  getMembers: () => request('/members'),
  createMember: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),

  getLoans: () => request('/loans'),
  borrowBook: (data) => request('/loans', { method: 'POST', body: JSON.stringify(data) }),
  returnLoan: (id) => request(`/loans/${id}/return`, { method: 'POST' }),
};
