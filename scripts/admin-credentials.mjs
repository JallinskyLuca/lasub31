import { emitKeypressEvents } from 'node:readline';
import { randomBytes } from 'node:crypto';
import { passwordHash } from '../netlify/lib/security.mjs';

async function hiddenInput(label) {
  if (!process.stdin.isTTY) throw new Error('Ejecutá este comando en una terminal interactiva.');
  process.stdout.write(label);
  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((resolve, reject) => {
    let password = '';
    const done = () => { process.stdin.removeListener('keypress', onKey); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); };
    function onKey(value, key = {}) {
      if (key.ctrl && key.name === 'c') { done(); reject(new Error('Cancelado.')); }
      else if (key.name === 'return') { done(); resolve(password); }
      else if (key.name === 'backspace') password = [...password].slice(0, -1).join('');
      else if (value && !key.ctrl && !key.meta) password += value;
    }
    process.stdin.on('keypress', onKey);
  });
}
try {
  const password = await hiddenInput('Elegí una contraseña de 16 a 256 caracteres (no se mostrará): ');
  if (password.length < 16 || password.length > 256) throw new Error('Usá entre 16 y 256 caracteres.');
  if (password !== await hiddenInput('Repetí la contraseña: ')) throw new Error('Las contraseñas no coinciden.');
  console.log('\nCopiá estos valores en las variables de entorno de Netlify (Production, Functions).');
  console.log('ADMIN_ORIGIN=https://lasub31.netlify.app');
  console.log('ADMIN_PASSWORD_HASH=' + await passwordHash(password));
  console.log('ADMIN_SESSION_SECRET=' + randomBytes(32).toString('hex'));
  console.log('\nNo guardes estos valores en el repositorio ni los pegues en el chat.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
