import React, { useEffect, useState } from 'react';
import { solicitar } from './apiAutenticacion.js';

export function FormularioLogin({ alIngresar }) {
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [credencial, setCredencial] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [finBloqueo, setFinBloqueo] = useState(null);
  const [restante, setRestante] = useState(0);

  useEffect(() => {
    if (!finBloqueo) return;
    const actualizar = () => setRestante(Math.max(0, Math.ceil((finBloqueo - Date.now()) / 1000)));
    actualizar();
    const timer = setInterval(actualizar, 1000);
    return () => clearInterval(timer);
  }, [finBloqueo]);

  async function enviar(event) {
    event.preventDefault();
    setEnviando(true);
    setMensaje('');
    try {
      await solicitar('/login', { method: 'POST', body: JSON.stringify({ nombreUsuario, credencial }) });
      setCredencial('');
      await alIngresar();
    } catch (error) {
      setMensaje(error.message);
      if (error.data?.bloqueadoHasta) {
        // El reloj local solo dibuja la espera. Cada intento lo decide el backend.
        const duracion = new Date(error.data.bloqueadoHasta) - new Date(error.data.horaServidor);
        setFinBloqueo(Date.now() + duracion);
      } else setFinBloqueo(null);
    } finally {
      setEnviando(false);
    }
  }

  return <form onSubmit={enviar} className="login-form">
    <h2>Iniciar sesión</h2>
    <p className="muted">Ingresa con tu cuenta de farmacia.</p>
    <label htmlFor="usuario">Usuario</label>
    <input id="usuario" autoComplete="username" required maxLength={80} value={nombreUsuario}
      onChange={event => { setNombreUsuario(event.target.value); setMensaje(''); setFinBloqueo(null); }} />
    <label htmlFor="credencial">Contraseña</label>
    <input id="credencial" type="password" autoComplete="current-password" required maxLength={1024}
      value={credencial} onChange={event => setCredencial(event.target.value)} />
    {mensaje && <div className="notice" role="alert">{mensaje}</div>}
    {finBloqueo && <p role="status">{restante > 0
      ? `Tiempo restante aproximado ${Math.floor(restante / 60)} min ${restante % 60} s`
      : 'El tiempo indicado terminó. Puedes volver a intentarlo.'}</p>}
    <button disabled={enviando} type="submit">{enviando ? 'Comprobando…' : 'Iniciar sesión'}<span aria-hidden="true"> →</span></button>
  </form>;
}
