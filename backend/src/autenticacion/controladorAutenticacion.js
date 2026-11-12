import { enTransaccion } from '../config/database.js';
import { RepositorioUsuario, UsuarioNoEncontrado } from './repositorioUsuario.js';
import { RepositorioEstadoAutenticacion } from './repositorioEstadoAutenticacion.js';
import { ServicioAutenticacion } from './servicioAutenticacion.js';
import { RepositorioSesion, leerToken, DURACION_SESION_MS } from './repositorioSesion.js';
import { SECCIONES } from './secciones.js';

export function crearControlador(pool, { cookieSecure = false, reloj } = {}) {
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: cookieSecure, path: '/' };
  return {
    async iniciar(req, res) {
      const { nombreUsuario, credencial } = req.body || {};
      if (typeof nombreUsuario !== 'string' || !nombreUsuario.trim() || nombreUsuario.length > 80 ||
          typeof credencial !== 'string' || !credencial || Buffer.byteLength(credencial) > 1024) {
        return res.status(400).json({ mensaje: 'Ingresa un usuario y una contraseña válidos.' });
      }
      const { resultado, token } = await enTransaccion(pool, async client => {
        const servicio = new ServicioAutenticacion(new RepositorioUsuario(client),
          new RepositorioEstadoAutenticacion(client), reloj);
        const resultado = await servicio.autenticar(nombreUsuario.trim(), credencial);
        let token;
        if (resultado.autenticado) {
          token = await new RepositorioSesion(client).crear(resultado.usuario.usuarioId, leerToken(req));
        }
        return { resultado, token };
      });
      // La cookie solo se entrega después del COMMIT, incluida la escritura de sesión.
      if (token) res.cookie('inventario_sid', token, { ...cookieOptions, maxAge: DURACION_SESION_MS });
      res.status(resultado.autenticado ? 200 : resultado.bloqueadoHasta ? 423 : 401).json(resultado);
    },

    async exigirSesion(req, res, next) {
      const token = leerToken(req);
      if (!token) return res.status(401).json({ mensaje: 'Inicia sesión para continuar.' });
      const usuario = await enTransaccion(pool, async client => {
        const usuarioId = await new RepositorioSesion(client).buscar(token);
        if (!usuarioId) return null;
        try {
          return await new RepositorioUsuario(client).buscarPorId(usuarioId);
        } catch (error) {
          if (error instanceof UsuarioNoEncontrado) return null;
          throw error;
        }
      });
      if (!usuario?.activo) return res.status(401).json({ mensaje: 'La sesión ha finalizado.' });
      req.usuario = usuario;
      next();
    },

    inicio(req, res) {
      res.json({ usuario: req.usuario, secciones: SECCIONES
        .filter(item => req.usuario.tienePermiso(item.permiso))
        .map(item => ({ ...item, estado: 'Próximamente' })) });
    },

    seccion(req, res) {
      const seccion = SECCIONES.find(item => item.permiso === req.params.permiso);
      if (!seccion) return res.status(404).json({ mensaje: 'Sección desconocida.' });
      if (!req.usuario.tienePermiso(seccion.permiso)) {
        return res.status(403).json({ mensaje: 'Tu rol no tiene acceso a esta sección.' });
      }
      res.json({ ...seccion, estado: 'Próximamente' });
    },

    async cerrar(req, res) {
      const token = leerToken(req);
      if (token) await enTransaccion(pool, client => new RepositorioSesion(client).eliminar(token));
      res.clearCookie('inventario_sid', cookieOptions);
      res.json({ mensaje: 'Sesión cerrada.' });
    }
  };
}
