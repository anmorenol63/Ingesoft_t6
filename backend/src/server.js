import { crearPool } from './config/database.js';
import { crearApp } from './app.js';

const pool = crearPool();
pool.on('error', () => console.error('Se interrumpió una conexión con PostgreSQL.'));
const app = crearApp(pool, { origin: process.env.APP_ORIGIN,
  cookieSecure: process.env.COOKIE_SECURE === 'true' });
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, '127.0.0.1', () => console.log(`API disponible en http://localhost:${port}`));

process.on('SIGINT', () => server.close(async () => { await pool.end(); process.exit(0); }));
