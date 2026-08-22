import { db } from './store.js';
import { ROLE_LABELS } from './data.js';
import { icon, toast, openModal, closeModal, confirmDialog } from './ui.js';
import { currentUser } from './auth.js';
import { validateForm } from './validation.js';
import { uid, escapeHtml } from './utils.js';

export function renderUsuarios(container){
  container.innerHTML = `
    <div class="view__head">
      <div><h1>Usuarios</h1><p>Cuentas del sistema y permisos por perfil</p></div>
      <button class="btn btn--primary" id="btnNuevoUsuario">${icon('plus')} Nuevo usuario</button>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Nombre</th><th>Usuario</th><th>Perfil</th><th>Estado</th><th></th></tr></thead>
        <tbody id="usuariosBody"></tbody>
      </table>
    </div>
  `;

  document.getElementById('btnNuevoUsuario').addEventListener('click', abrirModalUsuario);
  pintarUsuarios();
}

function pintarUsuarios(){
  const tbody = document.getElementById('usuariosBody');
  if(!tbody) return;
  const users = [...db.getUsers()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const yo = currentUser();

  tbody.innerHTML = users.map((u) => `
    <tr>
      <td class="table__name">${escapeHtml(u.nombre)}</td>
      <td class="table__muted">${escapeHtml(u.username)}</td>
      <td><span class="badge badge--rol">${ROLE_LABELS[u.role]}</span></td>
      <td><span class="badge badge--${u.activo ? 'atendido' : 'cancelado'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <div class="table__actions">
          <button class="icon-btn" data-toggle="${u.id}" title="${u.activo ? 'Desactivar' : 'Activar'}" ${u.id === yo.id ? 'disabled' : ''}>
            ${icon(u.activo ? 'ban' : 'check')}
          </button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const users = db.getUsers();
      const u = users.find((x) => x.id === btn.dataset.toggle);
      confirmDialog(`¿${u.activo ? 'Desactivar' : 'Activar'} la cuenta de ${u.nombre}?`, () => {
        u.activo = !u.activo;
        db.saveUsers(users);
        toast(`Cuenta ${u.activo ? 'activada' : 'desactivada'}`, 'success');
        pintarUsuarios();
      });
    });
  });
}

function abrirModalUsuario(){
  document.getElementById('formUsuario').reset();
  document.getElementById('usuarioError').hidden = true;
  document.querySelectorAll('#formUsuario .is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  document.querySelector('#usrRolePick input[value="paciente"]').checked = true;
  actualizarCamposRol();

  const selectPaciente = document.getElementById('usrPacienteVinculado');
  selectPaciente.innerHTML = db.getPacientes().map((p) => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`).join('');

  openModal('modalUsuario');
}

function actualizarCamposRol(){
  const rol = document.querySelector('#usrRolePick input:checked')?.value;
  document.getElementById('campoEspecialidad').hidden = rol !== 'profesional';
  document.getElementById('campoPacienteVinculado').hidden = rol !== 'paciente';
}

let formListo = false;
export function initUsuariosForm(){
  if(formListo) return;
  formListo = true;

  document.querySelectorAll('#usrRolePick input').forEach((input) => {
    input.addEventListener('change', actualizarCamposRol);
  });

  document.getElementById('formUsuario').addEventListener('submit', (e) => {
    e.preventDefault();
    if(!validateForm(e.target, 'Completá los campos obligatorios antes de crear el usuario.')) return;

    const nombre = document.getElementById('usrNombre').value.trim();
    const username = document.getElementById('usrUsername').value.trim().toLowerCase();
    const password = document.getElementById('usrPassword').value;
    const email = document.getElementById('usrEmail').value.trim();
    const role = document.querySelector('#usrRolePick input:checked').value;
    const errorEl = document.getElementById('usuarioError');

    const users = db.getUsers();
    if(users.some((u) => u.username.toLowerCase() === username)){
      errorEl.textContent = 'Ese nombre de usuario ya existe, elegí otro.';
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;

    const nuevo = { id: uid('u'), nombre, username, password, email, role, activo: true };

    if(role === 'profesional'){
      const especialidad = document.getElementById('usrEspecialidad').value.trim() || 'Consulta general';
      const profesionales = db.getProfesionales();
      const nuevoProfesional = { id: uid('p'), nombre, especialidad };
      profesionales.push(nuevoProfesional);
      db.saveProfesionales(profesionales);
      nuevo.profesionalId = nuevoProfesional.id;
    } else if(role === 'paciente'){
      nuevo.pacienteId = document.getElementById('usrPacienteVinculado').value;
    }

    users.push(nuevo);
    db.saveUsers(users);
    closeModal('modalUsuario');
    toast('Usuario creado correctamente', 'success');
    pintarUsuarios();
  });
}
