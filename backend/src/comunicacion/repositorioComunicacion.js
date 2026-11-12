const RECURSOS = {
  avisos: { tabla: 'aviso', id: 'aviso_id' },
  mensajes: { tabla: 'mensaje', id: 'mensaje_id' }
};

export class RepositorioComunicacion {
  constructor(pool, recurso) {
    this.pool = pool;
    this.recurso = RECURSOS[recurso];
    if (!this.recurso) throw new Error('Recurso inválido');
  }

  async listar(antes, despues = null) {
    const { tabla, id } = this.recurso;
    // Los identificadores provienen exclusivamente del mapa fijo anterior.
    const { rows } = await this.pool.query(`SELECT t.${id} AS id, t.contenido,
      t.publicado_en AS "publicadoEn", u.usuario_id AS "usuarioId",
      u.nombre AS autor, r.nombre AS rol
      FROM ${tabla} t JOIN usuario u USING (usuario_id) JOIN rol r USING (rol_id)
      WHERE ($1::integer IS NULL OR t.${id} < $1) AND ($2::integer IS NULL OR t.${id} > $2)
      ORDER BY t.${id} ${despues === null ? 'DESC' : 'ASC'} LIMIT 31`, [antes, despues]);
    const hayMas = rows.length > 30;
    const items = rows.slice(0, 30);
    return { items, siguiente: hayMas ? items.at(-1).id : null };
  }

  async guardar(usuarioId, contenido) {
    const { tabla, id } = this.recurso;
    const { rows } = await this.pool.query(`INSERT INTO ${tabla}(usuario_id,contenido)
      VALUES ($1,$2) RETURNING ${id} AS id, contenido, publicado_en AS "publicadoEn"`, [usuarioId, contenido]);
    return rows[0];
  }
}
