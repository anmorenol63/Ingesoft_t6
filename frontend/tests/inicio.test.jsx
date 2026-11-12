import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import { PaginaInicio } from '../src/inicio/paginaInicio.jsx';
import { MensajesLogin } from '../src/autenticacion/mensajesLogin.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

const usuario = { usuarioId: 4, nombre: 'Kevin Alexis Bermúdez Caicedo', rol: 'Auxiliar de farmacia', permisos: [] };
const secciones = [{ permiso: 'REGISTRAR_PRODUCTO', titulo: 'Productos' }, { permiso: 'REGISTRAR_ENTRADA', titulo: 'Entradas' }, { permiso: 'REGISTRAR_SALIDA', titulo: 'Salidas' }];

function prepararFetch() {
  const mock = vi.fn(async (ruta, options) => ({ ok: true, json: async () => options?.method === 'POST'
    ? { id: 1, contenido: JSON.parse(options.body).contenido, publicadoEn: new Date().toISOString(), autor: usuario.nombre, usuarioId: 4 }
    : { items: [], siguiente: null } }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

test('inicio presenta nombre completo, navegación y tres secciones verticales en orden', async () => {
  prepararFetch();
  render(<PaginaInicio inicio={{ usuario, secciones }} alExpirar={vi.fn()} />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(`Hola, ${usuario.nombre}`);
  expect(screen.getAllByRole('heading', { level: 2 }).slice(0, 3).map(n => n.textContent))
    .toEqual(['Resumen del inventario', 'Avisos', 'Chat para todos']);
  expect(screen.queryByRole('button', { name: /Bloquear lote/ })).toBeNull();
  expect(screen.queryByText(/Exportar/)).toBeNull();
  expect(screen.queryByLabelText('Publicar un comunicado')).toBeNull();
  expect(screen.getByLabelText('Tu mensaje al equipo')).toBeTruthy();
  await screen.findByText('Una conversación para todo el equipo');
});

test('chat envía solamente contenido y muestra el autor que devuelve el backend', async () => {
  const fetchMock = prepararFetch();
  render(<PaginaInicio inicio={{ usuario, secciones }} alExpirar={vi.fn()} />);
  await userEvent.type(screen.getByLabelText('Tu mensaje al equipo'), 'Hola equipo');
  await userEvent.click(screen.getByRole('button', { name: /Enviar mensaje/ }));
  expect(await screen.findByText('Hola equipo')).toBeTruthy();
  const envio = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
  expect(JSON.parse(envio[1].body)).toEqual({ contenido: 'Hola equipo' });
});

test('regente recibe navegación de bloqueo y formulario de avisos', async () => {
  prepararFetch();
  render(<PaginaInicio inicio={{ usuario: { ...usuario, rol: 'Regente de farmacia', permisos: ['PUBLICAR_AVISO'] },
    secciones: [...secciones, { permiso: 'BLOQUEAR_LOTE', titulo: 'Bloquear lote' }] }} alExpirar={vi.fn()} />);
  expect(screen.getByRole('navigation').textContent).toContain('Bloquear lote');
  expect(screen.getByLabelText('Publicar un comunicado')).toBeTruthy();
  await screen.findByText('Los comunicados empiezan aquí');
});

test('mensajes del login cambian automáticamente con capas para transición', () => {
  vi.useFakeTimers();
  const { container } = render(<MensajesLogin />);
  expect(container.querySelector('.is-visible h1').textContent).toBe('El cuidado empiezacon el control.');
  act(() => vi.advanceTimersByTime(7000));
  expect(container.querySelector('.is-visible h1').textContent).toBe('Cada medicamento cuenta.');
  expect(container.querySelectorAll('.is-visible').length).toBe(1);
});
