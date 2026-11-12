import React, { useState } from 'react';
import { solicitar } from '../autenticacion/apiAutenticacion.js';
import { TableroComunicacion } from './tableroComunicacion.jsx';

const ICONOS = { REGISTRAR_PRODUCTO: '⊞', REGISTRAR_ENTRADA: '↓', REGISTRAR_SALIDA: '↑', BLOQUEAR_LOTE: '⊘' };
const INDICADORES = ['Productos registrados', 'Unidades disponibles', 'Lotes próximos a vencer', 'Productos con stock bajo'];

export function PaginaInicio({ inicio, marca, alCerrar, alExpirar, errorSesion }) {
  const [vista, setVista] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const usuario = inicio.usuario;

  async function navegar(seccion) {
    if (!seccion) { setVista(null); setError(''); return; }
    setCargando(true);
    try {
      setVista(await solicitar(`/secciones/${seccion.permiso}`));
      setError('');
    } catch (error) {
      if (error.status === 401) alExpirar();
      setError(error.message);
    } finally { setCargando(false); }
  }

  return <div className="dashboard">
    <header className="app-header"><div className="header-main">{marca}<div className="header-account">
      <span className="account-role">{usuario.rol}</span><button className="logout-button" onClick={alCerrar}>Cerrar sesión <span aria-hidden="true">↗</span></button>
    </div></div>
      <nav className="top-navigation" aria-label="Navegación principal">
        <button className={!vista ? 'active' : ''} aria-current={!vista ? 'page' : undefined} onClick={() => navegar(null)}><span aria-hidden="true">⌂</span> Inicio</button>
        {inicio.secciones.map(seccion => <button key={seccion.permiso} className={vista?.permiso === seccion.permiso ? 'active' : ''}
          aria-current={vista?.permiso === seccion.permiso ? 'page' : undefined} disabled={cargando} onClick={() => navegar(seccion)}>
          <span aria-hidden="true">{ICONOS[seccion.permiso]}</span> {seccion.titulo}</button>)}
      </nav>
    </header>
    <main className="home-main">
      {(error || errorSesion) && <div className="notice" role="alert">{error || errorSesion}</div>}
      {cargando && <p role="status">Abriendo sección…</p>}
      {vista ? <div className="module-pending"><p className="eyebrow">INVENTARIO FARMACÉUTICO</p>
        <span className="module-icon" aria-hidden="true">{ICONOS[vista.permiso]}</span><h1>{vista.titulo}</h1>
        <p>{vista.descripcion}</p><p className="pending-label">Próximamente · Pendiente de implementación</p>
        <button className="secondary" onClick={() => navegar(null)}>Volver a Inicio</button></div> : <>
        <div className="welcome-banner"><div className="welcome-copy"><p className="eyebrow">INICIO</p>
          <h1>Hola, {usuario.nombre}</h1><p className="welcome-identity">{usuario.nombre} · {usuario.rol}</p>
          <p className="welcome-description">Un equipo conectado para cuidar cada detalle de la farmacia.</p>
        </div><div className="welcome-photo" role="img" aria-label="Interior de una farmacia organizada" /></div>

        <section className="home-section inventory-summary" aria-labelledby="resumen-titulo">
          <div className="section-heading"><div><p className="eyebrow">UNA MIRADA GENERAL</p><h2 id="resumen-titulo">Resumen del inventario</h2></div><span className="heading-icon" aria-hidden="true">⊞</span></div>
          <div className="inventory-metrics">{INDICADORES.map(titulo => <div className="inventory-metric" key={titulo}>
            <span className="metric-value" aria-label="Dato pendiente">—</span><h3>{titulo}</h3><span className="metric-pending">Datos pendientes</span></div>)}</div>
          <div className="inventory-alert"><span aria-hidden="true">ⓘ</span><div><strong>El resumen se completará con tu inventario</strong>
            <p>Los indicadores y las alertas estarán disponibles cuando se implementen los módulos de productos y lotes.</p></div></div>
        </section>

        <section className="home-section" aria-labelledby="avisos-titulo"><div className="section-heading"><div><p className="eyebrow">INFORMACIÓN DEL EQUIPO</p>
          <h2 id="avisos-titulo">Avisos</h2><p>Las indicaciones importantes, en un mismo lugar.</p></div><span className="heading-icon" aria-hidden="true">◎</span></div>
          <TableroComunicacion tipo="avisos" usuario={usuario} alExpirar={alExpirar} />
        </section>

        <section className="home-section" aria-labelledby="chat-titulo"><div className="section-heading"><div><p className="eyebrow">CONVERSACIÓN INTERNA</p>
          <h2 id="chat-titulo">Chat para todos</h2><p>Conecta con las personas que cuidan la farmacia contigo.</p></div><span className="heading-icon" aria-hidden="true">◌</span></div>
          <TableroComunicacion tipo="mensajes" usuario={usuario} alExpirar={alExpirar} />
        </section>
      </>}
    </main>
    <footer className="app-footer"><div className="footer-columns"><div className="footer-brand">{marca}<p>Organización, cuidado y comunicación para el inventario farmacéutico.</p></div>
      <div><h2>En Pharmasyst</h2><button onClick={() => navegar(null)}>Inicio y comunicación</button>
        {inicio.secciones.map(seccion => <button key={seccion.permiso} onClick={() => navegar(seccion)}>{seccion.titulo}</button>)}</div>
      <div><h2>El proyecto</h2><p>Ingeniería de Software I</p><p>Universidad Nacional de Colombia</p><p>Sede Bogotá · Equipo 6</p></div></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Pharmasyst</span><span>Proyecto académico · Gestión de inventario farmacéutico</span></div>
    </footer>
  </div>;
}
