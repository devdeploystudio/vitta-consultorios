import { currentUser } from './auth.js';
import { renderSidebar, setActiveNav } from './ui.js';
import { renderDashboard } from './dashboard.js';
import { renderTurnos } from './turnos.js';
import { renderPacientes } from './pacientes.js';
import { renderPerfil } from './perfil.js';
import { renderUsuarios } from './usuarios.js';
import { renderReportes } from './reportes.js';
import { renderBackups } from './backups.js';

const VIEWS = {
  dashboard: { title: 'Panel', sub: 'Resumen de la actividad del consultorio', roles: ['admin', 'profesional', 'recepcion', 'paciente'], render: renderDashboard },
  turnos: { title: 'Turnos', sub: 'Agenda y solicitudes', roles: ['admin', 'profesional', 'recepcion', 'paciente'], render: renderTurnos },
  pacientes: { title: 'Pacientes', sub: 'Fichas y datos de contacto', roles: ['admin', 'profesional', 'recepcion'], render: renderPacientes },
  perfil: { title: 'Mi perfil', sub: 'Tus datos y tu historial', roles: ['paciente'], render: renderPerfil },
  reportes: { title: 'Reportes', sub: 'Exportar información a Excel o PDF', roles: ['admin', 'profesional', 'recepcion'], render: renderReportes },
  usuarios: { title: 'Usuarios', sub: 'Cuentas y permisos por perfil', roles: ['admin'], render: renderUsuarios },
  backups: { title: 'Respaldos', sub: 'Copias de seguridad de la base de datos', roles: ['admin'], render: renderBackups },
};

function defaultViewFor(){
  return 'dashboard';
}

export function navigate(viewId){
  const user = currentUser();
  if(!user) return;

  const solicitada = VIEWS[viewId];
  const view = (solicitada && solicitada.roles.includes(user.role)) ? solicitada : VIEWS[defaultViewFor()];
  const id = Object.keys(VIEWS).find((k) => VIEWS[k] === view);

  if(location.hash.replace('#', '') !== id) location.hash = id;
  document.getElementById('topbarTitle').textContent = view.title;
  document.getElementById('topbarSub').textContent = view.sub;
  setActiveNav(id);

  const container = document.getElementById('viewContainer');
  container.innerHTML = '';
  view.render(container, user);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

export function initRouter(){
  const user = currentUser();
  if(!user) return;

  renderSidebar(user, navigate);

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if(VIEWS[id]) navigate(id);
  });

  const inicial = location.hash.replace('#', '');
  navigate(VIEWS[inicial] ? inicial : 'dashboard');
}
