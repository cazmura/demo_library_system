import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import express from 'express';
import { createDb } from './db.js';
import { createApp } from './app.js';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'library.db');
const PORT = process.env.PORT || 3001;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = createDb(DB_PATH);

const bookCount = db.prepare('SELECT COUNT(*) AS count FROM books').get().count;
if (bookCount === 0) {
  seed(db);
}

const app = createApp(db);

const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Library API listening on port ${PORT}`);
});
