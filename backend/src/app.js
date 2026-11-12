import express from 'express';
import { rutasAutenticacion } from './autenticacion/rutasAutenticacion.js';
import { rutasComunicacion } from './comunicacion/rutasComunicacion.js';

export function crearApp(pool, options = {}) {
  const app = express();
  const origin = options.origin || 'http://localhost:5173';
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    // Los POST del navegador requieren el origen configurado, incluido login.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('Origin') !== origin) {
      return res.status(403).json({ mensaje: 'Origen de solicitud no autorizado.' });
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ estado: 'Disponible' });
  });
  app.use('/api', rutasAutenticacion(pool, options));
  app.use('/api/comunicacion', rutasComunicacion(pool, options));
  app.use((req, res) => res.status(404).json({ mensaje: 'Recurso desconocido.' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      return res.status(400).json({ mensaje: 'Solicitud JSON inválida o demasiado grande.' });
    }
    // Se omiten detalles técnicos para proteger hashes, consultas y conexión.
    res.status(503).json({ mensaje: 'No se pudo completar la operación. Intenta nuevamente.' });
  });
  return app;
}
