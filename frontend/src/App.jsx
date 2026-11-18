import { NavLink, Route, Routes } from 'react-router-dom';
import BooksPage from './pages/BooksPage.jsx';
import MembersPage from './pages/MembersPage.jsx';
import LoansPage from './pages/LoansPage.jsx';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>図書館貸出システム</h1>
        <nav>
          <NavLink to="/" end>
            蔵書
          </NavLink>
          <NavLink to="/members">会員</NavLink>
          <NavLink to="/loans">貸出</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<BooksPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/loans" element={<LoansPage />} />
        </Routes>
      </main>
    </div>
  );
}
