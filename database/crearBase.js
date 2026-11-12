import pg from '../backend/node_modules/pg/lib/index.js';

const database = process.env.PGDATABASE;
if (!/^[a-z][a-z0-9_]{0,62}$/.test(database || '')) throw new Error('PGDATABASE inválido');
const client = new pg.Client({ database: 'postgres', connectionTimeoutMillis: 5000 });
try {
  await client.connect();
  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
  if (!rows.length) await client.query(`CREATE DATABASE "${database}"`);
  console.log('Base de datos preparada.');
} catch {
  console.error('No se pudo crear la base. Revisa la conexión y el permiso CREATEDB.');
  process.exitCode = 1;
} finally {
  await client.end();
}
