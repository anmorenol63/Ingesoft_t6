import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import pg from 'pg';
import { crearApp } from '../../src/app.js';
import { crearHash } from '../../src/autenticacion/usuario.js';

test('avisos y chat persistentes, validación, identidad de sesión y permisos', async t => {
  const admin = new pg.Pool();
  const schema = `comunicacion_test_${Date.now()}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({ options: `-c search_path=${schema}` });
  let server;
  t.after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  await pool.query(await readFile(new URL('../../../database/schema.sql', import.meta.url), 'utf8'));
  await pool.query(`INSERT INTO rol(nombre,descripcion) VALUES ('Regente de farmacia','Prueba'),('Auxiliar de farmacia','Prueba');
    INSERT INTO permiso(nombre,descripcion) VALUES ('BLOQUEAR_LOTE','Prueba');
    INSERT INTO rol_permiso VALUES (1,1)`);
  const hash = await crearHash('Prueba123!');
  await pool.query(`INSERT INTO usuario(nombre,nombre_usuario,credencial_hash,rol_id) VALUES
    ('Regente Nombre Completo','regente',$1,1),('Auxiliar Nombre Completo','auxiliar',$1,2)`, [hash]);
  await pool.query('INSERT INTO estado_autenticacion(usuario_id) SELECT usuario_id FROM usuario');
  const migracion = await readFile(new URL('../../../database/comunicacion.sql', import.meta.url), 'utf8');
  await pool.query(migracion);
  await pool.query(migracion);
  async function arrancar() {
    server = crearApp(pool).listen(0, '127.0.0.1');
    await once(server, 'listening');
  }
  await arrancar();
  async function request(ruta, cookie, contenido) {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api${ruta}`, {
      method: contenido === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173', ...(cookie ? { Cookie: cookie } : {}) },
      body: contenido === undefined ? undefined : JSON.stringify(contenido)
    });
    return { status: res.status, data: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] };
  }
  const regente = (await request('/login', null, { nombreUsuario: 'regente', credencial: 'Prueba123!' })).cookie;
  const auxiliar = (await request('/login', null, { nombreUsuario: 'auxiliar', credencial: 'Prueba123!' })).cookie;

  await t.test('lecturas y escrituras exigen sesión, avisos exigen regente', async () => {
    for (const ruta of ['avisos', 'mensajes']) {
      assert.equal((await request(`/comunicacion/${ruta}`)).status, 401);
      assert.equal((await request(`/comunicacion/${ruta}`, null, { contenido: 'Prueba' })).status, 401);
    }
    assert.equal((await request('/comunicacion/avisos', auxiliar, { contenido: 'Prueba' })).status, 403);
    assert.equal((await request('/secciones/BLOQUEAR_LOTE', auxiliar)).status, 403);
    assert.equal((await request('/secciones/BLOQUEAR_LOTE', regente)).status, 200);
    assert.equal((await request('/secciones/EXPORTAR_INVENTARIO', regente)).status, 404);
  });
  await t.test('contenido vacío, excesivo y autor suplantado se rechazan', async () => {
    for (const [ruta, maximo] of [['avisos', 2000], ['mensajes', 1000]]) {
      for (const contenido of ['', '  ', 123, 'a'.repeat(maximo + 1)]) {
        assert.equal((await request(`/comunicacion/${ruta}`, regente, { contenido })).status, 400);
      }
      assert.equal((await request(`/comunicacion/${ruta}`, auxiliar, { contenido: 'Hola', usuarioId: 1, autor: 'Regente' })).status, ruta === 'avisos' ? 403 : 400);
    }
    assert.equal((await request('/comunicacion/mensajes?antes=abc', auxiliar)).status, 400);
  });
  await t.test('publicar, consultar y conservar autor y nombre completo', async () => {
    const aviso = await request('/comunicacion/avisos', regente, { contenido: 'Revisar los medicamentos.' });
    assert.equal(aviso.status, 201);
    assert.equal(aviso.data.autor, 'Regente Nombre Completo');
    assert.equal(aviso.data.rol, 'Regente de farmacia');
    assert.ok(Number.isFinite(Date.parse(aviso.data.publicadoEn)));
    for (const cookie of [regente, auxiliar]) {
      const mensaje = await request('/comunicacion/mensajes', cookie, { contenido: "Mensaje <script>prueba</script> ' ;" });
      assert.equal(mensaje.status, 201);
      assert.equal(mensaje.data.autor, cookie === regente ? 'Regente Nombre Completo' : 'Auxiliar Nombre Completo');
    }
    assert.equal((await request('/comunicacion/avisos', auxiliar)).data.items[0].contenido, 'Revisar los medicamentos.');
    await new Promise(resolve => server.close(resolve));
    await arrancar();
    assert.equal((await request('/comunicacion/avisos', auxiliar)).data.items.length, 1);
    assert.equal((await request('/comunicacion/mensajes', auxiliar)).data.items.length, 2);
  });
  await t.test('historial paginado y actualización incremental sin perder mensajes', async () => {
    for (let i = 0; i < 35; i++) await request('/comunicacion/mensajes', auxiliar, { contenido: `Mensaje ${i}` });
    const recientes = (await request('/comunicacion/mensajes', regente)).data;
    assert.equal(recientes.items.length, 30);
    const antiguos = (await request(`/comunicacion/mensajes?antes=${recientes.siguiente}`, regente)).data;
    assert.equal(antiguos.items.length, 7);
    const nuevos = (await request('/comunicacion/mensajes?despues=0', auxiliar)).data;
    assert.equal(nuevos.items.length, 30);
    assert.ok(nuevos.items[0].id < nuevos.items.at(-1).id);
    assert.equal((await request(`/comunicacion/mensajes?despues=${nuevos.siguiente}`, auxiliar)).data.items.length, 7);
  });
  await t.test('fallos de PostgreSQL se comunican sin confirmar publicaciones', async () => {
    await pool.query('ALTER TABLE aviso RENAME TO aviso_no_disponible');
    assert.equal((await request('/comunicacion/avisos', regente, { contenido: 'Prueba' })).status, 503);
    await pool.query('ALTER TABLE aviso_no_disponible RENAME TO aviso');
    assert.equal((await request('/comunicacion/avisos', regente)).data.items.length, 1);
  });
});
