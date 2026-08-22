// capa de persistencia. todo vive en localStorage, hace de "base de datos" para la demo.

import { buildSeed } from './data.js';

const KEYS = {
  users: 'vitta_users',
  pacientes: 'vitta_pacientes',
  profesionales: 'vitta_profesionales',
  turnos: 'vitta_turnos',
  notifs: 'vitta_notifs',
  backups: 'vitta_backups_log',
  meta: 'vitta_meta',
  session: 'vitta_session',
};

function load(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeed(){
  if(localStorage.getItem(KEYS.meta)) return;
  const seed = buildSeed();
  save(KEYS.users, seed.users);
  save(KEYS.pacientes, seed.pacientes);
  save(KEYS.profesionales, seed.profesionales);
  save(KEYS.turnos, seed.turnos);
  save(KEYS.notifs, []);
  save(KEYS.backups, []);
  save(KEYS.meta, { instaladoEn: new Date().toISOString(), lastBackup: null, lastAutoBackupDay: null });
}

export const db = {
  getUsers: () => load(KEYS.users, []),
  saveUsers: (v) => save(KEYS.users, v),

  getPacientes: () => load(KEYS.pacientes, []),
  savePacientes: (v) => save(KEYS.pacientes, v),

  getProfesionales: () => load(KEYS.profesionales, []),
  saveProfesionales: (v) => save(KEYS.profesionales, v),

  getTurnos: () => load(KEYS.turnos, []),
  saveTurnos: (v) => save(KEYS.turnos, v),

  getNotifs: () => load(KEYS.notifs, []),
  saveNotifs: (v) => save(KEYS.notifs, v),

  getBackups: () => load(KEYS.backups, []),
  saveBackups: (v) => save(KEYS.backups, v),

  getMeta: () => load(KEYS.meta, {}),
  saveMeta: (v) => save(KEYS.meta, v),

  getSession: () => load(KEYS.session, null),
  setSession: (userId) => save(KEYS.session, { userId, desde: new Date().toISOString() }),
  clearSession: () => localStorage.removeItem(KEYS.session),
};

export function exportSnapshot(){
  const snapshot = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    if(name === 'session') return;
    snapshot[name] = load(key, null);
  });
  return snapshot;
}

export function restoreSnapshot(snapshot){
  Object.entries(KEYS).forEach(([name, key]) => {
    if(name === 'session') return;
    if(snapshot[name] !== undefined) save(key, snapshot[name]);
  });
}
