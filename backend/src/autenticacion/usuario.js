import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function crearHash(credencial) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(credencial, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

export class Usuario {
  #credencialHash;

  constructor({ usuarioId, nombre, nombreUsuario, activo, rol, permisos, credencialHash }) {
    Object.assign(this, { usuarioId, nombre, nombreUsuario, activo, rol, permisos });
    this.#credencialHash = credencialHash;
  }

  async verificarCredenciales(credencial) {
    const partes = this.#credencialHash.split('$');
    if (partes.length !== 3 || partes[0] !== 'scrypt' || !/^[a-f0-9]{32}$/.test(partes[1]) || !/^[a-f0-9]{128}$/.test(partes[2])) {
      throw new Error('Hash almacenado inválido');
    }
    const hash = await scrypt(credencial, partes[1], 64, SCRYPT_OPTIONS);
    return timingSafeEqual(hash, Buffer.from(partes[2], 'hex'));
  }

  tienePermiso(permiso) {
    return this.activo && this.permisos.includes(permiso);
  }

  toJSON() {
    return { usuarioId: this.usuarioId, nombre: this.nombre, nombreUsuario: this.nombreUsuario, rol: this.rol, permisos: this.permisos };
  }
}
