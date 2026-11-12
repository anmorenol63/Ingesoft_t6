import { Usuario } from './usuario.js';

export class UsuarioNoEncontrado extends Error {}

export class RepositorioUsuario {
  constructor(client) { this.client = client; }

  async buscarPorNombre(nombre) {
    // El bloqueo de la fila serializa todos los intentos de una misma cuenta.
    const { rows } = await this.client.query(`
      SELECT u.usuario_id, u.nombre, u.nombre_usuario, u.credencial_hash, u.activo,
             r.nombre AS rol
      FROM usuario u JOIN rol r USING (rol_id)
      WHERE u.nombre_usuario = $1 FOR UPDATE OF u`, [nombre]);
    if (!rows.length) throw new UsuarioNoEncontrado();
    return this.convertir(rows[0]);
  }

  async buscarPorId(usuarioId) {
    const { rows } = await this.client.query(`
      SELECT u.*, r.nombre AS rol FROM usuario u JOIN rol r USING (rol_id)
      WHERE u.usuario_id = $1`, [usuarioId]);
    if (!rows.length) throw new UsuarioNoEncontrado();
    return this.convertir(rows[0]);
  }

  async convertir(row) {
    const { rows } = await this.client.query(`
      SELECT p.nombre FROM permiso p JOIN rol_permiso rp USING (permiso_id)
      JOIN usuario u USING (rol_id) WHERE u.usuario_id = $1 ORDER BY p.nombre`, [row.usuario_id]);
    return new Usuario({ usuarioId: row.usuario_id, nombre: row.nombre,
      nombreUsuario: row.nombre_usuario, credencialHash: row.credencial_hash,
      activo: row.activo, rol: row.rol, permisos: rows.map(item => item.nombre) });
  }
}
