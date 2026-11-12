import { Router } from 'express';
import { crearControlador } from './controladorAutenticacion.js';

export function rutasAutenticacion(pool, options) {
  const router = Router();
  const controlador = crearControlador(pool, options);
  router.post('/login', controlador.iniciar);
  router.post('/logout', controlador.cerrar);
  router.get('/inicio', controlador.exigirSesion, controlador.inicio);
  router.get('/secciones/:permiso', controlador.exigirSesion, controlador.seccion);
  return router;
}
