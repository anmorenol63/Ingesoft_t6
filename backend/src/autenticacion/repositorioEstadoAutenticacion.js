import { EstadoAutenticacion } from './estadoAutenticacion.js';

export class RepositorioEstadoAutenticacion {
  constructor(client) { this.client = client; }

  async buscarEstado(usuarioId) {
    const { rows } = await this.client.query(`SELECT intentos_fallidos, bloqueado_hasta
      FROM estado_autenticacion WHERE usuario_id = $1 FOR UPDATE`, [usuarioId]);
    if (!rows.length) throw new Error('Falta el estado de autenticación');
    return new EstadoAutenticacion(rows[0].intentos_fallidos, rows[0].bloqueado_hasta);
  }

  async guardarEstado(usuarioId, estado) {
    const { rows } = await this.client.query(`UPDATE estado_autenticacion
      SET intentos_fallidos = $2, bloqueado_hasta = $3 WHERE usuario_id = $1
      RETURNING intentos_fallidos, bloqueado_hasta`,
    [usuarioId, estado.intentosFallidos, estado.bloqueadoHasta]);
    if (!rows.length) throw new Error('No se guardó el estado');
    return new EstadoAutenticacion(rows[0].intentos_fallidos, rows[0].bloqueado_hasta);
  }
}
