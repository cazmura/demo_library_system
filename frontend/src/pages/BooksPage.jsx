import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function BooksPage() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState({});
  const [error, setError] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', totalCopies: 1 });
  const [showForm, setShowForm] = useState(false);

  async function loadBooks(q = '') {
    setBooks(await api.getBooks(q));
  }

  useEffect(() => {
    loadBooks();
    api.getMembers().then(setMembers);
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    await loadBooks(query);
  }

  async function handleBorrow(bookId) {
    setError('');
    const memberId = selectedMember[bookId];
    if (!memberId) {
      setError('貸出先の会員を選択してください');
      return;
    }
    try {
      await api.borrowBook({ bookId, memberId: Number(memberId) });
      await loadBooks(query);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(bookId) {
    setError('');
    try {
      await api.deleteBook(bookId);
      await loadBooks(query);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddBook(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createBook({ ...newBook, totalCopies: Number(newBook.totalCopies) || 1 });
      setNewBook({ title: '', author: '', isbn: '', totalCopies: 1 });
      setShowForm(false);
      await loadBooks(query);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>蔵書一覧</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="タイトルまたは著者で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="検索"
        />
        <button type="submit">検索</button>
      </form>

      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>タイトル</th>
            <th>著者</th>
            <th>ISBN</th>
            <th>在庫</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.isbn}</td>
              <td>
                {book.available_copies} / {book.total_copies}
              </td>
              <td className="actions">
                <select
                  aria-label={`${book.title}の貸出先`}
                  value={selectedMember[book.id] || ''}
                  onChange={(e) =>
                    setSelectedMember((prev) => ({ ...prev, [book.id]: e.target.value }))
                  }
                >
                  <option value="">会員を選択</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={book.available_copies < 1}
                  onClick={() => handleBorrow(book.id)}
                >
                  貸出
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(book.id)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
          {books.length === 0 && (
            <tr>
              <td colSpan={5}>該当する本が見つかりません</td>
            </tr>
          )}
        </tbody>
      </table>

      <button type="button" onClick={() => setShowForm((v) => !v)}>
        {showForm ? '閉じる' : '本を追加'}
      </button>

      {showForm && (
        <form onSubmit={handleAddBook} className="book-form">
          <input
            placeholder="タイトル"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            required
          />
          <input
            placeholder="著者"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
            required
          />
          <input
            placeholder="ISBN"
            value={newBook.isbn}
            onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
            required
          />
          <input
            type="number"
            min="1"
            placeholder="冊数"
            value={newBook.totalCopies}
            onChange={(e) => setNewBook({ ...newBook, totalCopies: e.target.value })}
          />
          <button type="submit">登録</button>
        </form>
      )}
    </section>
  );
}
