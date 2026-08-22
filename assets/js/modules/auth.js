import { db } from './store.js';
import { ROLE_LABELS } from './data.js';

export { ROLE_LABELS };

export function login(username, password){
  const user = db.getUsers().find(
    (u) => u.username.toLowerCase() === String(username).trim().toLowerCase(),
  );
  if(!user) return { ok: false, message: 'No encontramos ese usuario.' };
  if(!user.activo) return { ok: false, message: 'Esta cuenta está deshabilitada. Consultá con un administrador.' };
  if(user.password !== password) return { ok: false, message: 'Contraseña incorrecta.' };
  db.setSession(user.id);
  return { ok: true, user };
}

export function logout(){
  db.clearSession();
}

export function currentUser(){
  const session = db.getSession();
  if(!session) return null;
  return db.getUsers().find((u) => u.id === session.userId) || null;
}
