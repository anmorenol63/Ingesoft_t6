BEGIN;
CREATE TABLE IF NOT EXISTS rol (
  rol_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL UNIQUE CHECK (length(trim(nombre)) > 0),
  descripcion text NOT NULL
);
CREATE TABLE IF NOT EXISTS permiso (
  permiso_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  descripcion text NOT NULL
);
CREATE TABLE IF NOT EXISTS rol_permiso (
  rol_id integer REFERENCES rol NOT NULL,
  permiso_id integer REFERENCES permiso NOT NULL,
  PRIMARY KEY (rol_id, permiso_id)
);
CREATE TABLE IF NOT EXISTS usuario (
  usuario_id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre text NOT NULL CHECK (length(trim(nombre)) > 0),
  nombre_usuario text NOT NULL UNIQUE CHECK (length(trim(nombre_usuario)) > 0),
  credencial_hash text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  rol_id integer REFERENCES rol NOT NULL
);
CREATE TABLE IF NOT EXISTS estado_autenticacion (
  usuario_id integer PRIMARY KEY REFERENCES usuario,
  intentos_fallidos integer NOT NULL DEFAULT 0 CHECK (intentos_fallidos BETWEEN 0 AND 5),
  bloqueado_hasta timestamptz,
  CHECK ((intentos_fallidos = 5) = (bloqueado_hasta IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS sesion (
  token_hash text PRIMARY KEY,
  usuario_id integer REFERENCES usuario NOT NULL,
  expira_en timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS sesion_expira_en_idx ON sesion(expira_en);
-- Identifica exclusivamente cuentas creadas por el script de demostración.
CREATE TABLE IF NOT EXISTS cuenta_demo (
  usuario_id integer PRIMARY KEY REFERENCES usuario,
  nombre_usuario text NOT NULL UNIQUE
);
COMMIT;
