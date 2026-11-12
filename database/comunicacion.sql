BEGIN;
CREATE TABLE IF NOT EXISTS aviso (
  aviso_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES usuario,
  contenido text NOT NULL CHECK (length(trim(contenido)) BETWEEN 1 AND 2000),
  publicado_en timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS mensaje (
  mensaje_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES usuario,
  contenido text NOT NULL CHECK (length(trim(contenido)) BETWEEN 1 AND 1000),
  publicado_en timestamptz NOT NULL DEFAULT clock_timestamp()
);
-- Cada permiso se deriva del alcance actualizado y se asigna al rol existente.
INSERT INTO permiso(nombre, descripcion) VALUES ('PUBLICAR_AVISO', 'Publicar comunicados internos')
ON CONFLICT(nombre) DO NOTHING;
INSERT INTO rol_permiso(rol_id, permiso_id)
SELECT r.rol_id, p.permiso_id FROM rol r CROSS JOIN permiso p
WHERE r.nombre='Regente de farmacia' AND p.nombre='PUBLICAR_AVISO'
ON CONFLICT DO NOTHING;
DELETE FROM rol_permiso WHERE permiso_id IN
  (SELECT permiso_id FROM permiso WHERE nombre='EXPORTAR_INVENTARIO');
DELETE FROM permiso WHERE nombre='EXPORTAR_INVENTARIO';
COMMIT;
