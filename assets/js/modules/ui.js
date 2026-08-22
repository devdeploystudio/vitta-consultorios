// piezas de interfaz que se repiten en toda la app: iconos, toasts, modales,
// el menu lateral y el panel de notificaciones del topbar.

import { db } from './store.js';
import { ROLE_LABELS } from './data.js';
import { initials, escapeHtml } from './utils.js';
import { contarNoLeidas, marcarLeidas } from './notifications.js';

const ICON_PATHS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  users: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17.5" cy="8.5" r="2.6"/><path d="M15.5 14.6c2.6.4 4.5 2.3 4.5 5.4"/>',
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-4 3.4-6.6 7.5-6.6s7.5 2.6 7.5 6.6"/>',
  download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M4 19h16"/>',
  shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="M9 12l2 2 4-4.3"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="2.7"/><path d="M4.5 5.5v13c0 1.5 3.4 2.7 7.5 2.7s7.5-1.2 7.5-2.7v-13"/><path d="M4.5 12c0 1.5 3.4 2.7 7.5 2.7s7.5-1.2 7.5-2.7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.3H4c.5-.8 2-2.3 2-6.3Z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>',
  edit: '<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l3 3"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.3"/><path d="M4 7l8 6 8-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16.2" r=".4" fill="currentColor" stroke="none"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5V5.5Z"/><path d="M4 5.5v16"/>',
  home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
};

export function icon(name, extraClass){
  const inner = ICON_PATHS[name] || ICON_PATHS.alert;
  return `<svg class="${extraClass || ''}" viewBox="0 0 24 24">${inner}</svg>`;
}

// ---------------- toasts ----------------

export function toast(mensaje, tipo = 'info'){
  const stack = document.getElementById('toastStack');
  if(!stack) return;
  const el = document.createElement('div');
  el.className = `toast toast--${tipo}`;
  const iconName = tipo === 'success' ? 'check' : tipo === 'error' ? 'alert' : 'mail';
  el.innerHTML = `<span class="toast__icon">${icon(iconName)}</span><span>${escapeHtml(mensaje)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(12px)';
    setTimeout(() => el.remove(), 320);
  }, 3600);
}

// ---------------- modales ----------------

export function openModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('is-visible');
}

export function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('is-visible');
}

export function closeAllModals(){
  document.querySelectorAll('.modal-backdrop.is-visible').forEach((el) => el.classList.remove('is-visible'));
}

let onConfirm = null;

export function confirmDialog(mensaje, callback){
  document.getElementById('modalConfirmText').textContent = mensaje;
  onConfirm = callback;
  openModal('modalConfirm');
}

// ---------------- sidebar ----------------

export const NAV_CONFIG = [
  { id: 'dashboard', label: 'Panel', icon: 'grid', roles: ['admin', 'profesional', 'recepcion', 'paciente'] },
  { id: 'turnos', label: 'Turnos', icon: 'calendar', roles: ['admin', 'profesional', 'recepcion', 'paciente'] },
  { id: 'pacientes', label: 'Pacientes', icon: 'users', roles: ['admin', 'profesional', 'recepcion'] },
  { id: 'perfil', label: 'Mi perfil', icon: 'user', roles: ['paciente'] },
  { id: 'reportes', label: 'Reportes', icon: 'download', roles: ['admin', 'profesional', 'recepcion'] },
  { id: 'usuarios', label: 'Usuarios', icon: 'shield', roles: ['admin'] },
  { id: 'backups', label: 'Respaldos', icon: 'database', roles: ['admin'] },
];

export function renderSidebar(user, navigate){
  const nav = document.getElementById('sidebarNav');
  const items = NAV_CONFIG.filter((item) => item.roles.includes(user.role));
  nav.innerHTML = items.map((item) => `
    <a href="#${item.id}" class="sidebar__link" data-view="${item.id}">
      ${icon(item.icon)}<span>${item.label}</span>
    </a>
  `).join('') + `
    <a href="index.html" class="sidebar__link">
      ${icon('home')}<span>Volver al sitio</span>
    </a>
    <a href="pages/sistema/manual.html" class="sidebar__link" target="_blank" rel="noopener">
      ${icon('book')}<span>Manual de uso</span>
    </a>
  `;

  nav.querySelectorAll('[data-view]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.dataset.view);
      document.getElementById('sidebar')?.classList.remove('is-open');
      document.getElementById('sidebarBackdrop')?.classList.remove('is-visible');
    });
  });

  document.getElementById('sidebarUserName').textContent = user.nombre;
  document.getElementById('sidebarUserRole').textContent = ROLE_LABELS[user.role];
  document.getElementById('sidebarAvatar').textContent = initials(user.nombre);
}

export function setActiveNav(viewId){
  document.querySelectorAll('#sidebarNav [data-view]').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.view === viewId);
  });
}

// ---------------- topbar: menu mobile + notificaciones ----------------

let chromeListo = false;

export function initChrome(){
  if(chromeListo) return;
  chromeListo = true;

  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  menuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
    backdrop.classList.toggle('is-visible');
  });
  backdrop?.addEventListener('click', () => {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
  });

  const bellBtn = document.getElementById('notifBell');
  const panel = document.getElementById('notifPanel');
  bellBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = !panel.classList.contains('is-visible');
    panel.classList.toggle('is-visible');
    if(willOpen){
      renderNotifPanel();
      marcarLeidas();
      updateNotifDot();
    }
  });
  document.addEventListener('click', (e) => {
    if(panel && !panel.contains(e.target) && e.target !== bellBtn){
      panel.classList.remove('is-visible');
    }
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal-backdrop').forEach((backdropEl) => {
    backdropEl.addEventListener('click', (e) => {
      if(e.target === backdropEl) backdropEl.classList.remove('is-visible');
    });
  });

  document.getElementById('modalConfirmBtn')?.addEventListener('click', () => {
    closeModal('modalConfirm');
    const cb = onConfirm;
    onConfirm = null;
    if(cb) cb();
  });

  updateNotifDot();
}

export function updateNotifDot(){
  const dot = document.getElementById('notifDot');
  if(!dot) return;
  dot.hidden = contarNoLeidas() === 0;
}

function renderNotifPanel(){
  const list = document.getElementById('notifList');
  const notifs = db.getNotifs();
  if(notifs.length === 0){
    list.innerHTML = '<p class="notif-panel__empty">No hay avisos todavía.</p>';
    return;
  }
  list.innerHTML = notifs.slice(0, 12).map((n) => `
    <div class="notif-row">
      <p class="notif-row__msg">${escapeHtml(n.mensaje)}</p>
      <p class="notif-row__time">${new Date(n.fecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  `).join('');
}
