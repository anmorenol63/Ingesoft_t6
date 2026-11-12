import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { solicitar } from '../autenticacion/apiAutenticacion.js';

export function FechaPublicacion({ fecha }) {
  return <time dateTime={fecha}>{new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(fecha))}</time>;
}

export function TableroComunicacion({ tipo, usuario, alExpirar }) {
  const esAviso = tipo === 'avisos';
  const puedePublicar = !esAviso || (usuario.rol === 'Regente de farmacia' && usuario.permisos.includes('PUBLICAR_AVISO'));
  const [items, setItems] = useState([]);
  const [contenido, setContenido] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [siguiente, setSiguiente] = useState(null);
  const ultimoId = useRef(0);
  const lista = useRef(null);
  const seguirConversacion = useRef(true);
  const maximo = esAviso ? 2000 : 1000;
  const ruta = `/comunicacion/${tipo}`;

  useLayoutEffect(() => {
    if (!esAviso && seguirConversacion.current && lista.current) {
      lista.current.scrollTop = lista.current.scrollHeight;
    }
  }, [items, esAviso]);

  function agregar(nuevos) {
    setItems(anteriores => [...new Map([...anteriores, ...nuevos].map(item => [item.id, item])).values()]);
    ultimoId.current = Math.max(ultimoId.current, ...nuevos.map(item => item.id));
  }

  useEffect(() => {
    let activo = true;
    let timer;
    async function actualizar(primera = false) {
      try {
        let pagina;
        do {
          pagina = await solicitar(primera ? ruta : `${ruta}?despues=${ultimoId.current}`);
          if (!activo) return;
          agregar(pagina.items);
          if (primera) setSiguiente(pagina.siguiente);
        } while (!primera && pagina.siguiente !== null);
        setError('');
      } catch (error) {
        if (!activo) return;
        if (error.status === 401) alExpirar();
        setError(error.message);
      } finally {
        if (activo) { setCargando(false); timer = setTimeout(() => actualizar(), 8000); }
      }
    }
    actualizar(true);
    return () => { activo = false; clearTimeout(timer); };
  }, [ruta, alExpirar]);

  async function cargarAnteriores() {
    seguirConversacion.current = false;
    setCargandoHistorial(true);
    try {
      const pagina = await solicitar(`${ruta}?antes=${siguiente}`);
      agregar(pagina.items);
      setSiguiente(pagina.siguiente);
    } catch (error) { setError(error.message); }
    finally { setCargandoHistorial(false); }
  }

  async function enviar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError('');
    try {
      const item = await solicitar(ruta, { method: 'POST', body: JSON.stringify({ contenido }) });
      seguirConversacion.current = true;
      // El cursor de lectura avanza solo tras consultar para incluir mensajes concurrentes.
      setItems(anteriores => [...new Map([...anteriores, item].map(item => [item.id, item])).values()]);
      setContenido('');
    } catch (error) {
      if (error.status === 401) alExpirar();
      setError(error.message);
    } finally { setEnviando(false); }
  }

  const ordenados = [...items].sort((a, b) => esAviso ? b.id - a.id : a.id - b.id);
  return <div className={`communication-board ${esAviso ? 'notice-board' : 'chat-board'}`}>
    {error && <p className="notice" role="alert">{error}</p>}
    {cargando && <p role="status" className="feed-state">Cargando {esAviso ? 'avisos' : 'conversación'}…</p>}
    {!cargando && !items.length && <div className="feed-empty"><span aria-hidden="true">{esAviso ? '◎' : '◌'}</span>
      <h3>{esAviso ? 'Los comunicados empiezan aquí' : 'Una conversación para todo el equipo'}</h3>
      <p>{esAviso ? 'Los avisos del regente aparecerán en este espacio.' : 'Comparte una indicación, una pregunta o una novedad de la farmacia.'}</p></div>}
    {!esAviso && siguiente !== null && <button className="history-button" disabled={cargandoHistorial} onClick={cargarAnteriores}>Ver mensajes anteriores</button>}
    <div ref={lista} className={esAviso ? 'notice-list' : 'message-list'}
      onScroll={event => {
        const elemento = event.currentTarget;
        seguirConversacion.current = elemento.scrollHeight - elemento.scrollTop - elemento.clientHeight < 60;
      }} aria-label={esAviso ? 'Avisos publicados' : 'Conversación general'}>
      {ordenados.map(item => <article key={item.id} className={`feed-item ${item.usuarioId === usuario.usuarioId ? 'own-message' : ''}`}>
        <div className="avatar" aria-hidden="true">{item.autor.split(' ').map(p => p[0]).slice(0, 2).join('')}</div>
        <div className="feed-content"><div className="feed-meta"><strong>{item.autor}</strong><FechaPublicacion fecha={item.publicadoEn} /></div>
          {esAviso && <span className="author-role">{item.rol}</span>}<p>{item.contenido}</p></div>
      </article>)}
    </div>
    {esAviso && siguiente !== null && <button className="history-button" disabled={cargandoHistorial} onClick={cargarAnteriores}>Ver avisos anteriores</button>}
    {puedePublicar && <form className="compose-form" onSubmit={enviar}>
      <label htmlFor={`contenido-${tipo}`}>{esAviso ? 'Publicar un comunicado' : 'Tu mensaje al equipo'}</label>
      <textarea id={`contenido-${tipo}`} value={contenido} required maxLength={maximo} rows={esAviso ? 3 : 2}
        placeholder={esAviso ? 'Escribe una indicación importante para la farmacia…' : 'Escribe tu mensaje…'}
        onChange={event => setContenido(event.target.value)} />
      <div className="compose-actions"><span>{contenido.length}/{maximo}</span>
        <button disabled={enviando || !contenido.trim()}>{enviando ? 'Enviando…' : esAviso ? 'Publicar aviso' : 'Enviar mensaje'} <span aria-hidden="true">↗</span></button></div>
    </form>}
    <p className="feed-caption">{esAviso ? 'Comunicados oficiales del regente de farmacia.' : 'Espacio compartido del equipo. La conversación se actualiza cada 8 segundos.'}</p>
  </div>;
}
