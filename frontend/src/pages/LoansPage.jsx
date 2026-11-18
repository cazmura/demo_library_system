import { useEffect, useState } from 'react';
import { api } from '../api.js';

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('ja-JP');
}

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState('');

  async function loadLoans() {
    setLoans(await api.getLoans());
  }

  useEffect(() => {
    loadLoans();
  }, []);

  async function handleReturn(loanId) {
    setError('');
    try {
      await api.returnLoan(loanId);
      await loadLoans();
    } catch (err) {
      setError(err.message);
    }
  }

  const active = loans.filter((l) => !l.returned_at);
  const history = loans.filter((l) => l.returned_at);

  return (
    <section>
      <h2>貸出中の本</h2>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>本</th>
            <th>会員</th>
            <th>貸出日</th>
            <th>返却期限</th>
            <th>状態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {active.map((loan) => (
            <tr key={loan.id} className={loan.overdue ? 'overdue' : ''}>
              <td>{loan.book_title}</td>
              <td>{loan.member_name}</td>
              <td>{formatDate(loan.borrowed_at)}</td>
              <td>{formatDate(loan.due_at)}</td>
              <td>{loan.overdue ? '延滞' : '貸出中'}</td>
              <td>
                <button type="button" onClick={() => handleReturn(loan.id)}>
                  返却
                </button>
              </td>
            </tr>
          ))}
          {active.length === 0 && (
            <tr>
              <td colSpan={6}>現在貸出中の本はありません</td>
            </tr>
          )}
        </tbody>
      </table>

      <h2>返却済みの履歴</h2>
      <table>
        <thead>
          <tr>
            <th>本</th>
            <th>会員</th>
            <th>貸出日</th>
            <th>返却日</th>
          </tr>
        </thead>
        <tbody>
          {history.map((loan) => (
            <tr key={loan.id}>
              <td>{loan.book_title}</td>
              <td>{loan.member_name}</td>
              <td>{formatDate(loan.borrowed_at)}</td>
              <td>{formatDate(loan.returned_at)}</td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr>
              <td colSpan={4}>返却履歴はまだありません</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
