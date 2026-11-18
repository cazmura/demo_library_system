import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [error, setError] = useState('');

  async function loadMembers() {
    setMembers(await api.getMembers());
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleAddMember(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createMember(newMember);
      setNewMember({ name: '', email: '' });
      await loadMembers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section>
      <h2>会員一覧</h2>

      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>名前</th>
            <th>メールアドレス</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <form onSubmit={handleAddMember} className="member-form">
        <input
          placeholder="名前"
          value={newMember.name}
          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="メールアドレス"
          value={newMember.email}
          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
          required
        />
        <button type="submit">会員を追加</button>
      </form>
    </section>
  );
}
