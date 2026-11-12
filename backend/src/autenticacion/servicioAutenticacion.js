import { UsuarioNoEncontrado } from './repositorioUsuario.js';

export class ServicioAutenticacion {
  constructor(repositorioUsuario, repositorioEstado, reloj = () => new Date()) {
    Object.assign(this, { repositorioUsuario, repositorioEstado, reloj });
  }

  async autenticar(nombreUsuario, credencial) {
    let usuario;
    try {
      usuario = await this.repositorioUsuario.buscarPorNombre(nombreUsuario);
    } catch (error) {
      if (!(error instanceof UsuarioNoEncontrado)) throw error;
      return this.rechazar();
    }
    if (!usuario.activo) return this.rechazar();
    const estado = await this.repositorioEstado.buscarEstado(usuario.usuarioId);
    // Se lee el reloj después de adquirir las filas para evitar horas obsoletas al esperar.
    const ahora = this.reloj();
    if (estado.estaBloqueado(ahora)) return this.bloquear(estado, ahora);
    if (!await usuario.verificarCredenciales(credencial)) {
      const bloqueado = estado.registrarFallo(ahora);
      await this.repositorioEstado.guardarEstado(usuario.usuarioId, estado);
      return bloqueado ? this.bloquear(estado, ahora) : this.rechazar();
    }
    estado.registrarExito();
    await this.repositorioEstado.guardarEstado(usuario.usuarioId, estado);
    return { autenticado: true, mensaje: 'Autenticación exitosa', usuario };
  }

  autorizar(usuario, permiso) { return usuario.tienePermiso(permiso); }

  rechazar() {
    return { autenticado: false, mensaje: 'Usuario o contraseña incorrectos.', usuario: null };
  }

  bloquear(estado, ahora) {
    return { autenticado: false, mensaje: 'Acceso bloqueado temporalmente por cinco minutos.',
      usuario: null, bloqueadoHasta: estado.bloqueadoHasta, horaServidor: ahora };
  }
}
