import { readFile } from 'node:fs/promises';
import { crearPool, enTransaccion } from '../backend/src/config/database.js';
import { crearHash } from '../backend/src/autenticacion/usuario.js';
import { SECCIONES } from '../backend/src/autenticacion/secciones.js';

const pool = crearPool();
const cuentas = [
  { nombreUsuario: 'regente01', nombre: 'Regente de demostración', rol: 'Regente de farmacia', clave: 'RegenteDemo2026!' },
  { nombreUsuario: 'auxiliar01', nombre: 'Auxiliar de demostración', rol: 'Auxiliar de farmacia', clave: 'AuxiliarDemo2026!' }
];

async function prepararDemo(client, reset) {
  for (const cuenta of cuentas) {
    const existente = await client.query(`SELECT u.usuario_id, d.usuario_id AS demo_id
      FROM usuario u LEFT JOIN cuenta_demo d USING (usuario_id) WHERE u.nombre_usuario=$1 FOR UPDATE OF u`, [cuenta.nombreUsuario]);
    if (existente.rows.length && !existente.rows[0].demo_id) {
      throw new Error('Nombre de demostración ocupado por una cuenta ajena');
    }
    if (existente.rows.length && !reset) continue;
    if (reset && !existente.rows.length) continue;
    const rol = await client.query(`INSERT INTO rol(nombre, descripcion) VALUES ($1, $2)
      ON CONFLICT(nombre) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING rol_id`, [cuenta.rol, 'Rol documentado en el diseño arquitectónico §2.1']);
    const rolId = rol.rows[0].rol_id;
    for (const seccion of SECCIONES) {
      if (cuenta.nombreUsuario === 'auxiliar01' && seccion.permiso === 'BLOQUEAR_LOTE') continue;
      const permiso = await client.query(`INSERT INTO permiso(nombre, descripcion) VALUES ($1,$2)
        ON CONFLICT(nombre) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING permiso_id`, [seccion.permiso, seccion.descripcion]);
      await client.query('INSERT INTO rol_permiso VALUES ($1,$2) ON CONFLICT DO NOTHING', [rolId, permiso.rows[0].permiso_id]);
    }
    const hash = await crearHash(cuenta.clave);
    const usuario = await client.query(`INSERT INTO usuario(nombre, nombre_usuario, credencial_hash, rol_id)
      VALUES ($1,$2,$3,$4) ON CONFLICT(nombre_usuario) DO UPDATE
      SET credencial_hash=EXCLUDED.credencial_hash, activo=true, rol_id=EXCLUDED.rol_id RETURNING usuario_id`,
    [cuenta.nombre, cuenta.nombreUsuario, hash, rolId]);
    const id = usuario.rows[0].usuario_id;
    await client.query('INSERT INTO cuenta_demo VALUES ($1,$2) ON CONFLICT DO NOTHING', [id, cuenta.nombreUsuario]);
    await client.query(`INSERT INTO estado_autenticacion(usuario_id) VALUES ($1)
      ON CONFLICT(usuario_id) DO UPDATE SET intentos_fallidos=0, bloqueado_hasta=NULL`, [id]);
    await client.query('DELETE FROM sesion WHERE usuario_id=$1', [id]);
  }
}

try {
  const comando = process.argv[2];
  if (comando === 'migrate') {
    await pool.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    await pool.query(await readFile(new URL('./comunicacion.sql', import.meta.url), 'utf8'));
  } else if (['seed', 'reset'].includes(comando)) {
    await enTransaccion(pool, client => prepararDemo(client, comando === 'reset'));
    await pool.query(await readFile(new URL('./comunicacion.sql', import.meta.url), 'utf8'));
  } else throw new Error('Comando desconocido');
  console.log('Preparación completada.');
} catch (error) {
  console.error('No se completó la preparación. Revisa la conexión, las tablas y los nombres de las cuentas de prueba.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
