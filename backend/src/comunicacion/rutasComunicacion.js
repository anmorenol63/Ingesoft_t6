import { Router } from 'express';
import { crearControlador } from '../autenticacion/controladorAutenticacion.js';
import { RepositorioComunicacion } from './repositorioComunicacion.js';

export function rutasComunicacion(pool, options) {
  const router = Router();
  router.use(crearControlador(pool, options).exigirSesion);
  for (const recurso of ['avisos', 'mensajes']) {
    const repositorio = new RepositorioComunicacion(pool, recurso);
    router.get(`/${recurso}`, async (req, res) => {
      const antes = req.query.antes === undefined ? null : Number(req.query.antes);
      const despues = req.query.despues === undefined ? null : Number(req.query.despues);
      if ((antes !== null && despues !== null) || [antes, despues].some(valor => valor !== null &&
          (!Number.isSafeInteger(valor) || valor < 0 || valor > 2147483647))) {
        return res.status(400).json({ mensaje: 'Cursor de historial inválido.' });
      }
      res.json(await repositorio.listar(antes, despues));
    });
    router.post(`/${recurso}`, async (req, res) => {
      if (recurso === 'avisos' && (req.usuario.rol !== 'Regente de farmacia' || !req.usuario.tienePermiso('PUBLICAR_AVISO'))) {
        return res.status(403).json({ mensaje: 'Solo el regente puede publicar avisos oficiales.' });
      }
      const body = req.body;
      const maximo = recurso === 'avisos' ? 2000 : 1000;
      if (!body || Object.keys(body).some(key => key !== 'contenido') || typeof body.contenido !== 'string' ||
          !body.contenido.trim() || [...body.contenido.trim()].length > maximo) {
        return res.status(400).json({ mensaje: `Escribe un contenido de entre 1 y ${maximo} caracteres.` });
      }
      const item = await repositorio.guardar(req.usuario.usuarioId, body.contenido.trim());
      res.status(201).json({ ...item, usuarioId: req.usuario.usuarioId, autor: req.usuario.nombre, rol: req.usuario.rol });
    });
  }
  return router;
}
