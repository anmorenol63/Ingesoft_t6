export const MAX_INTENTOS_FALLIDOS = 5;
export const DURACION_BLOQUEO_MS = 5 * 60 * 1000;

export class EstadoAutenticacion {
  constructor(intentosFallidos = 0, bloqueadoHasta = null) {
    if (!Number.isInteger(intentosFallidos) || intentosFallidos < 0 || intentosFallidos > 5) {
      throw new Error('Contador de autenticación inválido');
    }
    this.intentosFallidos = intentosFallidos;
    this.bloqueadoHasta = bloqueadoHasta === null ? null : new Date(bloqueadoHasta);
    if (this.bloqueadoHasta && !Number.isFinite(this.bloqueadoHasta.getTime())) {
      throw new Error('Fecha de bloqueo inválida');
    }
    if ((intentosFallidos === 5) !== Boolean(this.bloqueadoHasta)) {
      throw new Error('Estado de bloqueo incoherente');
    }
  }

  estaBloqueado(ahora) {
    if (!(ahora instanceof Date) || !Number.isFinite(ahora.getTime())) {
      throw new Error('Hora del servidor inválida');
    }
    return this.bloqueadoHasta !== null && ahora < this.bloqueadoHasta;
  }

  registrarFallo(ahora) {
    if (this.estaBloqueado(ahora)) throw new Error('Bloqueo vigente');
    // Un bloqueo vencido inicia un ciclo nuevo, incluso en el límite exacto.
    if (this.bloqueadoHasta) this.registrarExito();
    this.intentosFallidos += 1;
    if (this.intentosFallidos === MAX_INTENTOS_FALLIDOS) {
      this.bloqueadoHasta = new Date(ahora.getTime() + DURACION_BLOQUEO_MS);
      return true;
    }
    return false;
  }

  registrarExito() {
    this.intentosFallidos = 0;
    this.bloqueadoHasta = null;
  }
}
