import React, { useEffect, useState } from 'react';

const MENSAJES = [
  ['El cuidado empieza con el control.', 'Un espacio para organizar el inventario de tu farmacia.'],
  ['Cada medicamento cuenta.', 'Mantén el control de tus productos y cuida cada detalle.'],
  ['Organización que genera confianza.', 'Gestiona tu inventario de forma sencilla y segura.'],
  ['Una farmacia organizada, una atención más segura.', 'La información que necesitas, siempre en un mismo lugar.']
];

export function MensajesLogin() {
  const [actual, setActual] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setActual(indice => (indice + 1) % MENSAJES.length), 7000);
    return () => clearInterval(timer);
  }, []);
  return <div className="story-copy rotating-copy" aria-label="Cuidado y organización farmacéutica">
    {MENSAJES.map(([titulo, descripcion], indice) => <div key={titulo}
      className={`story-message ${indice === actual ? 'is-visible' : ''}`} aria-hidden={indice !== actual}>
      <h1>{indice === 0 ? <>El cuidado empieza<br />con el control.</> : titulo}</h1><p>{descripcion}</p>
    </div>)}
  </div>;
}
