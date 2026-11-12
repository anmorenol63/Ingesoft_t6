import pg from 'pg';

export function crearPool() {
  return new pg.Pool({ connectionTimeoutMillis: 5000 });
}

export async function enTransaccion(pool, operacion) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultado = await operacion(client);
    await client.query('COMMIT');
    return resultado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
