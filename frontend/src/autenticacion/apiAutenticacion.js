export async function solicitar(ruta, opciones = {}) {
  let response;
  try {
    response = await fetch(`/api${ruta}`, { credentials: 'same-origin', ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers } });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.');
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.mensaje || 'No se pudo completar la solicitud.');
    Object.assign(error, { status: response.status, data });
    throw error;
  }
  return data;
}
