import test from 'node:test';
import assert from 'node:assert/strict';
import { EstadoAutenticacion, DURACION_BLOQUEO_MS } from '../../src/autenticacion/estadoAutenticacion.js';
import { ServicioAutenticacion } from '../../src/autenticacion/servicioAutenticacion.js';
import { Usuario, crearHash } from '../../src/autenticacion/usuario.js';

const ahora = new Date('2026-11-12T12:00:00Z');

test('cuenta nueva, primeros cuatro fallos y quinto bloqueo de cinco minutos', () => {
  const estado = new EstadoAutenticacion();
  assert.equal(estado.intentosFallidos, 0);
  assert.equal(estado.bloqueadoHasta, null);
  for (let intento = 1; intento <= 4; intento++) {
    assert.equal(estado.registrarFallo(ahora), false);
    assert.equal(estado.intentosFallidos, intento);
    assert.equal(estado.bloqueadoHasta, null);
  }
  assert.equal(estado.registrarFallo(ahora), true);
  assert.equal(estado.bloqueadoHasta - ahora, DURACION_BLOQUEO_MS);
  assert.throws(() => estado.registrarFallo(ahora));
  assert.equal(estado.intentosFallidos, 5);
});

test('expiración exacta inicia un ciclo con un fallo y éxito limpia el estado', () => {
  const fin = new Date(ahora.getTime() + DURACION_BLOQUEO_MS);
  const estado = new EstadoAutenticacion(5, fin);
  assert.equal(estado.estaBloqueado(new Date(fin - 1)), true);
  assert.equal(estado.estaBloqueado(fin), false);
  assert.equal(estado.registrarFallo(fin), false);
  assert.equal(estado.intentosFallidos, 1);
  assert.equal(estado.bloqueadoHasta, null);
  estado.registrarExito();
  assert.equal(estado.intentosFallidos, 0);
});

test('datos o reloj inválidos se rechazan', () => {
  assert.throws(() => new EstadoAutenticacion(-1));
  assert.throws(() => new EstadoAutenticacion(5));
  assert.throws(() => new EstadoAutenticacion(1, ahora));
  assert.throws(() => new EstadoAutenticacion(5, 'inválida'));
  assert.throws(() => new EstadoAutenticacion().estaBloqueado(new Date('inválida')));
});

test('durante bloqueo el servicio omite contraseña y guardado, sin extenderlo', async () => {
  const fin = new Date(ahora.getTime() + DURACION_BLOQUEO_MS);
  const estado = new EstadoAutenticacion(5, fin);
  const servicio = new ServicioAutenticacion({ buscarPorNombre: async () => ({
    activo: true, usuarioId: 1, verificarCredenciales: () => assert.fail('No verificar contraseña')
  }) }, { buscarEstado: async () => estado, guardarEstado: () => assert.fail('No guardar') }, () => ahora);
  for (const clave of ['incorrecta', 'correcta']) {
    const resultado = await servicio.autenticar('usuario', clave);
    assert.equal(resultado.autenticado, false);
    assert.deepEqual(resultado.bloqueadoHasta, fin);
    assert.equal(estado.intentosFallidos, 5);
  }
});

test('fallos de consulta o escritura se propagan e impiden confirmar acceso', async () => {
  const errorDb = new Error('Fallo de prueba');
  const consulta = new ServicioAutenticacion({ buscarPorNombre: async () => { throw errorDb; } }, {});
  await assert.rejects(consulta.autenticar('usuario', 'clave'), errorDb);
  const usuario = { activo: true, usuarioId: 1, verificarCredenciales: async () => true };
  for (const operacion of ['buscarEstado', 'guardarEstado']) {
    const repositorio = { buscarEstado: async () => new EstadoAutenticacion(3), guardarEstado: async () => {} };
    repositorio[operacion] = async () => { throw errorDb; };
    const servicio = new ServicioAutenticacion({ buscarPorNombre: async () => usuario }, repositorio, () => ahora);
    await assert.rejects(servicio.autenticar('usuario', 'clave'), errorDb);
  }
});

test('hash con sal, verificación y serialización sin hash', async () => {
  const hash = await crearHash('clave de prueba');
  const usuario = new Usuario({ credencialHash: hash, activo: true, permisos: ['BLOQUEAR_LOTE'] });
  assert.equal(await usuario.verificarCredenciales('clave de prueba'), true);
  assert.equal(await usuario.verificarCredenciales('otra'), false);
  assert.equal(usuario.tienePermiso('BLOQUEAR_LOTE'), true);
  assert.equal(usuario.tienePermiso('OTRO'), false);
  assert.equal(JSON.stringify(usuario).includes(hash), false);
  assert.notEqual(await crearHash('clave de prueba'), hash);
});
