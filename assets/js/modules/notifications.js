// registro de "avisos por mail" simulados. no se manda nada de verdad,
// pero queda el rastro como si el sistema hubiese disparado el correo.

import { db } from './store.js';
import { uid } from './utils.js';

export function notificar(mensaje){
  const notifs = db.getNotifs();
  notifs.unshift({ id: uid('n'), mensaje, fecha: new Date().toISOString(), leida: false });
  db.saveNotifs(notifs.slice(0, 40));
}

export function marcarLeidas(){
  const notifs = db.getNotifs().map((n) => ({ ...n, leida: true }));
  db.saveNotifs(notifs);
}

export function contarNoLeidas(){
  return db.getNotifs().filter((n) => !n.leida).length;
}
