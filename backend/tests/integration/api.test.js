import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import pg from 'pg';
import { crearApp } from '../../src/app.js';
import { crearHash } from '../../src/autenticacion/usuario.js';

test('CU-03 API, PostgreSQL, concurrencia, permisos, fallos y reinicio real', async t => {
  const admin = new pg.Pool();
  const schema = `cu03_test_${Date.now()}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({ options: `-c search_path=${schema}` });
  let server;
  let proceso;
  t.after(async () => {
    if (proceso && proceso.exitCode === null && proceso.signalCode === null) { proceso.kill(); await once(proceso, 'exit'); }
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  await pool.query(await readFile(new URL('../../../database/schema.sql', import.meta.url), 'utf8'));
  await pool.query(`INSERT INTO rol(nombre,descripcion) VALUES ('Regente de farmacia','Prueba'),('Auxiliar de farmacia','Prueba');
    INSERT INTO permiso(nombre,descripcion) VALUES ('BLOQUEAR_LOTE','Prueba');
    INSERT INTO rol_permiso VALUES (1,1)`);
  const hash = await crearHash('Correcta2026!');
  for (const [nombre, rol] of [['regente', 1], ['auxiliar', 2]]) {
    await pool.query(`INSERT INTO usuario(nombre,nombre_usuario,credencial_hash,rol_id) VALUES ($1,$1,$2,$3)`, [nombre, hash, rol]);
  }
  await pool.query('INSERT INTO estado_autenticacion(usuario_id) SELECT usuario_id FROM usuario');
  let reloj = new Date('2026-11-12T12:00:00Z');
  server = crearApp(pool, { reloj: () => reloj }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  let base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, { method = 'GET', body, cookie, origin = 'http://localhost:5173' } = {}) {
    const response = await fetch(`${base}/api${path}`, { method, headers: {
      'Content-Type': 'application/json', Origin: origin, ...(cookie ? { Cookie: cookie } : {})
    }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  }
  const login = (nombreUsuario, credencial = 'incorrecta') => request('/login', { method: 'POST', body: { nombreUsuario, credencial } });
  const estado = async () => (await pool.query('SELECT * FROM estado_autenticacion WHERE usuario_id=1')).rows[0];

  await t.test('cero fallos, validación y recursos protegidos sin sesión', async () => {
    assert.equal((await estado()).intentos_fallidos, 0);
    assert.equal((await estado()).bloqueado_hasta, null);
    assert.equal((await request('/inicio')).status, 401);
    assert.equal((await request('/secciones/BLOQUEAR_LOTE')).status, 401);
    assert.equal((await request('/login', { method: 'POST', body: { nombreUsuario: [] } })).status, 400);
    assert.equal((await request('/login', { method: 'POST', origin: 'https://otro.test', body: {} })).status, 403);
    assert.equal((await login('desconocido')).status, 401);
  });
  await t.test('cuatro fallos y quinto bloqueo exacto', async () => {
    for (let i = 1; i <= 4; i++) {
      assert.equal((await login('regente')).status, 401);
      assert.equal((await estado()).intentos_fallidos, i);
    }
    assert.equal((await login('regente')).status, 423);
    assert.equal((await estado()).bloqueado_hasta - reloj, 300000);
  });
  await t.test('bloqueo rechaza contraseña correcta y conserva fecha y contador', async () => {
    const antes = await estado();
    assert.equal((await login('regente', 'Correcta2026!')).status, 423);
    assert.equal((await login('regente')).status, 423);
    assert.deepEqual(await estado(), antes);
  });
  await t.test('expiración y éxito con reinicio del contador y sesión real', async () => {
    reloj = new Date(reloj.getTime() + 300000);
    assert.equal((await login('regente')).status, 401);
    assert.equal((await estado()).intentos_fallidos, 1);
    const sesion = await login('regente', 'Correcta2026!');
    assert.equal(sesion.status, 200);
    assert.match(sesion.headers.get('set-cookie'), /HttpOnly/);
    assert.match(sesion.headers.get('set-cookie'), /SameSite=Strict/);
    assert.equal((await estado()).intentos_fallidos, 0);
    assert.equal(JSON.stringify(sesion.data).includes(hash), false);
    assert.equal((await request('/inicio', { cookie: sesion.cookie })).data.usuario.rol, 'Regente de farmacia');
    assert.equal((await request('/secciones/BLOQUEAR_LOTE', { cookie: sesion.cookie })).status, 200);
    const anterior = sesion.cookie;
    const nueva = await request('/login', { method: 'POST', cookie: anterior, body: { nombreUsuario: 'regente', credencial: 'Correcta2026!' } });
    assert.equal((await request('/inicio', { cookie: anterior })).status, 401);
    await request('/logout', { method: 'POST', cookie: nueva.cookie });
    assert.equal((await request('/inicio', { cookie: nueva.cookie })).status, 401);
  });
  await t.test('autorización por backend y expiración de sesión', async () => {
    const sesion = await login('auxiliar', 'Correcta2026!');
    assert.equal((await request('/secciones/BLOQUEAR_LOTE', { cookie: sesion.cookie })).status, 403);
    assert.equal((await request('/inicio', { cookie: sesion.cookie })).data.secciones.length, 0);
    await pool.query("UPDATE sesion SET expira_en=clock_timestamp()-interval '1 second'");
    assert.equal((await request('/inicio', { cookie: sesion.cookie })).status, 401);
  });
  await t.test('cinco solicitudes simultáneas conservan los cinco fallos', async () => {
    const respuestas = await Promise.all(Array.from({ length: 5 }, () => login('regente')));
    assert.equal(respuestas.filter(r => r.status === 423).length, 1);
    assert.equal((await estado()).intentos_fallidos, 5);
  });
  await t.test('fallos de PostgreSQL y escritura de sesión impiden acceso', async () => {
    reloj = new Date(reloj.getTime() + 300000);
    await pool.query('ALTER TABLE estado_autenticacion RENAME TO estado_no_disponible');
    const fallo = await login('regente', 'Correcta2026!');
    assert.equal(fallo.status, 503);
    assert.equal(fallo.cookie, undefined);
    await pool.query('ALTER TABLE estado_no_disponible RENAME TO estado_autenticacion');
    await pool.query('ALTER TABLE sesion RENAME TO sesion_no_disponible');
    const falloSesion = await login('regente', 'Correcta2026!');
    assert.equal(falloSesion.status, 503);
    assert.equal(falloSesion.cookie, undefined);
    assert.equal((await estado()).intentos_fallidos, 5);
    await pool.query('ALTER TABLE sesion_no_disponible RENAME TO sesion');
  });
  await t.test('contador y bloqueo sobreviven al reinicio del proceso Node', async () => {
    await new Promise(resolve => server.close(resolve));
    server = null;
    async function arrancar() {
      proceso = spawn(process.execPath, ['src/server.js'], { cwd: new URL('../..', import.meta.url),
        env: { ...process.env, PORT: '3197', PGOPTIONS: `-c search_path=${schema}` }, stdio: ['ignore', 'pipe', 'pipe'] });
      await Promise.race([once(proceso.stdout, 'data'), once(proceso, 'exit').then(() => { throw new Error('Servidor terminó'); })]);
      base = 'http://127.0.0.1:3197';
    }
    await pool.query('UPDATE estado_autenticacion SET intentos_fallidos=0,bloqueado_hasta=NULL WHERE usuario_id=1');
    await arrancar();
    for (let i = 0; i < 2; i++) await login('regente');
    proceso.kill(); await once(proceso, 'exit');
    await arrancar();
    assert.equal((await estado()).intentos_fallidos, 2);
    for (let i = 0; i < 3; i++) await login('regente');
    const antes = await estado();
    proceso.kill(); await once(proceso, 'exit');
    await arrancar();
    assert.equal((await login('regente', 'Correcta2026!')).status, 423);
    assert.deepEqual(await estado(), antes);
    proceso.kill(); await once(proceso, 'exit');
  });
});
