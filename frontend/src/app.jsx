import React, { useCallback, useEffect, useState } from 'react';
import { FormularioLogin } from './autenticacion/formularioLogin.jsx';
import { solicitar } from './autenticacion/apiAutenticacion.js';
import { MensajesLogin } from './autenticacion/mensajesLogin.jsx';
import { PaginaInicio } from './inicio/paginaInicio.jsx';

function Marca() {
  return <div className="brand"><img className="brand-symbol" src="/images/pharmasystEmblem.png" alt="" /><div><strong>Pharmasyst</strong><small>Inventario farmacéutico</small></div></div>;
}

export function App() {
  const [inicio, setInicio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const alExpirar = useCallback(() => setInicio(null), []);

  async function cargarSesion() {
    try {
      setInicio(await solicitar('/inicio'));
      setError('');
    } catch (error) {
      setInicio(null);
      if (error.status !== 401) throw error;
    } finally { setCargando(false); }
  }

  useEffect(() => { cargarSesion().catch(error => setError(error.message)); }, []);

  async function cerrarSesion() {
    try {
      await solicitar('/logout', { method: 'POST' });
      setInicio(null);
      setError('');
    } catch (error) { setError(error.message); }
  }

  if (cargando) return <main className="loading" role="status">Comprobando sesión…</main>;

  if (!inicio) return <main className="login-layout">
    <section className="login-story"><Marca /><MensajesLogin />
      <p className="academic">Ingeniería de Software I · Universidad Nacional de Colombia</p></section>
    <section className="login-panel"><div className="login-card"><Marca />
      {error && <div className="notice" role="alert">{error}</div>}
      <FormularioLogin alIngresar={cargarSesion} /></div></section>
  </main>;

  return <PaginaInicio inicio={inicio} marca={<Marca />} alCerrar={cerrarSesion} alExpirar={alExpirar} errorSesion={error} />;
}
