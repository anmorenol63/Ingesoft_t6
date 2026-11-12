// Capacidades de inventario del diseño 01, §2.1.
// BLOQUEAR_LOTE y REGISTRAR_SALIDA conservan los nombres de los contratos.
export const SECCIONES = [
  { permiso: 'REGISTRAR_PRODUCTO', titulo: 'Productos', descripcion: 'Registro de productos farmacéuticos.' },
  { permiso: 'REGISTRAR_ENTRADA', titulo: 'Entradas', descripcion: 'Ingreso de unidades al inventario.' },
  { permiso: 'REGISTRAR_SALIDA', titulo: 'Salidas', descripcion: 'Salida de unidades del inventario.' },
  { permiso: 'BLOQUEAR_LOTE', titulo: 'Bloquear lote', descripcion: 'Restricción de salida de lotes.' }
];
