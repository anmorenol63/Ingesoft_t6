import { createHash, randomBytes } from 'node:crypto';

export const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
export const hashToken = token => createHash('sha256').update(token).digest('hex');

export function leerToken(req) {
  const cookie = (req.headers.cookie || '').split(';').map(item => item.trim())
    .find(item => item.startsWith('inventario_sid='));
  const token = cookie?.slice('inventario_sid='.length);
  return /^[a-f0-9]{64}$/.test(token || '') ? token : null;
}

export class RepositorioSesion {
  constructor(client) { this.client = client; }

  async crear(usuarioId, tokenAnterior) {
    const token = randomBytes(32).toString('hex');
    // Solo el hash permanece en PostgreSQL. Se rota el identificador al autenticar.
    if (tokenAnterior) await this.eliminar(tokenAnterior);
    await this.client.query(`INSERT INTO sesion(token_hash, usuario_id, expira_en)
      VALUES ($1, $2, clock_timestamp() + interval '8 hours')`, [hashToken(token), usuarioId]);
    return token;
  }

  async buscar(token) {
    const { rows } = await this.client.query(`SELECT usuario_id FROM sesion
      WHERE token_hash = $1 AND expira_en > clock_timestamp()`, [hashToken(token)]);
    return rows[0]?.usuario_id;
  }

  async eliminar(token) {
    await this.client.query('DELETE FROM sesion WHERE token_hash = $1', [hashToken(token)]);
  }
}
