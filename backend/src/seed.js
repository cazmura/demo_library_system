export function seed(db) {
  const insertBook = db.prepare(
    'INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES (?, ?, ?, ?, ?)'
  );
  const insertMember = db.prepare('INSERT INTO members (name, email) VALUES (?, ?)');

  const books = [
    { title: '吾輩は猫である', author: '夏目漱石', isbn: '978-4-00-310101-1', copies: 2 },
    { title: '銀河鉄道の夜', author: '宮沢賢治', isbn: '978-4-00-311101-2', copies: 1 },
    { title: '人間失格', author: '太宰治', isbn: '978-4-10-100301-3', copies: 3 },
    { title: 'こころ', author: '夏目漱石', isbn: '978-4-10-101003-4', copies: 1 },
    { title: '羅生門', author: '芥川龍之介', isbn: '978-4-10-102501-5', copies: 2 },
    { title: '坊っちゃん', author: '夏目漱石', isbn: '978-4-10-100103-6', copies: 1 },
  ];

  const members = [
    { name: '佐藤 花子', email: 'hanako.sato@example.com' },
    { name: '鈴木 太郎', email: 'taro.suzuki@example.com' },
    { name: '田中 次郎', email: 'jiro.tanaka@example.com' },
  ];

  db.exec('BEGIN');
  try {
    for (const b of books) insertBook.run(b.title, b.author, b.isbn, b.copies, b.copies);
    for (const m of members) insertMember.run(m.name, m.email);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
