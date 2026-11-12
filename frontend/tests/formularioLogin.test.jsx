import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormularioLogin } from '../src/autenticacion/formularioLogin.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('envía credenciales y comunica éxito al contenedor', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ autenticado: true }) });
  vi.stubGlobal('fetch', fetchMock);
  const alIngresar = vi.fn();
  render(<FormularioLogin alIngresar={alIngresar} />);
  await userEvent.type(screen.getByLabelText('Usuario'), 'regente01');
  await userEvent.type(screen.getByLabelText('Contraseña'), 'clave');
  await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ nombreUsuario: 'regente01', credencial: 'clave' });
  expect(alIngresar).toHaveBeenCalledOnce();
});

test('muestra bloqueo del servidor y permite que el backend decida el siguiente intento', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 423, json: async () => ({
    mensaje: 'Bloqueo temporal vigente', horaServidor: '2026-11-12T12:00:00Z', bloqueadoHasta: '2026-11-12T12:05:00Z'
  }) }));
  render(<FormularioLogin alIngresar={vi.fn()} />);
  await userEvent.type(screen.getByLabelText('Usuario'), 'auxiliar01');
  await userEvent.type(screen.getByLabelText('Contraseña'), 'clave');
  await userEvent.click(screen.getByRole('button', { name: /Iniciar sesión/ }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Bloqueo temporal vigente');
  expect(screen.getByRole('status').textContent).toContain('5 min');
  expect(screen.getByRole('button').disabled).toBe(false);
});
