import { ensureSeed } from './modules/store.js';
import { login, logout, currentUser, ROLE_LABELS } from './modules/auth.js';
import { initChrome, toast } from './modules/ui.js';
import { initRouter } from './modules/router.js';
import { initTurnosForm } from './modules/turnos.js';
import { initPacientesForms } from './modules/pacientes.js';
import { initUsuariosForm } from './modules/usuarios.js';
import { ensureAutoBackup } from './modules/backups.js';
import { initCursor } from './modules/cursor.js';
import { initInputFilters, validateForm } from './modules/validation.js';

ensureSeed();

const DEMO_USERS = [
  { role: 'admin', username: 'admin', password: 'admin123' },
  { role: 'recepcion', username: 'recepcion', password: 'recepcion123' },
  { role: 'profesional', username: 'doctor', password: 'doctor123' },
  { role: 'paciente', username: 'paciente', password: 'paciente123' },
];

function pintarDemoUsers(){
  const cont = document.getElementById('demoUsers');
  cont.innerHTML = DEMO_USERS.map((u) => `
    <button type="button" class="login__demo-item" data-user="${u.username}" data-pass="${u.password}">
      <span class="login__demo-role">${ROLE_LABELS[u.role]}</span>
      <span class="login__demo-cred">${u.username} / ${u.password}</span>
    </button>
  `).join('');

  cont.querySelectorAll('[data-user]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('loginUser').value = btn.dataset.user;
      document.getElementById('loginPass').value = btn.dataset.pass;
    });
  });
}

function showApp(){
  document.getElementById('loginScreen').hidden = true;
  document.getElementById('app').classList.add('is-active');
  initChrome();
  initTurnosForm();
  initPacientesForms();
  initUsuariosForm();
  ensureAutoBackup();
  initRouter();
}

function showLogin(){
  document.getElementById('app').classList.remove('is-active');
  document.getElementById('loginScreen').hidden = false;
  document.getElementById('loginPass').value = '';
}

function initLoginForm(){
  const form = document.getElementById('loginForm');
  const errorEl = document.getElementById('loginError');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!validateForm(form, 'Completá usuario y contraseña para ingresar.')) return;
    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;
    const resultado = login(username, password);
    if(!resultado.ok){
      errorEl.textContent = resultado.message;
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;
    location.hash = '';
    showApp();
    toast(`Hola, ${resultado.user.nombre.split(' ')[0]}`, 'success');
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    logout();
    location.hash = '';
    showLogin();
  });
}

function boot(){
  pintarDemoUsers();
  initLoginForm();
  initCursor();
  initInputFilters();

  if(currentUser()){
    showApp();
  } else {
    showLogin();
  }

  setTimeout(() => document.getElementById('boot').classList.add('is-done'), 550);
}

boot();
