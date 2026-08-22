import { db } from './store.js';
import { icon, toast, openModal, closeModal } from './ui.js';
import { currentUser } from './auth.js';
import { validateForm } from './validation.js';
import { uid, todayISO, escapeHtml, formatFechaLarga } from './utils.js';

let busqueda = '';
let pacienteSeleccionado = null;
let pacienteEditId = null;

export function renderPacientes(container, user){
  const puedeEditar = user.role === 'admin' || user.role === 'recepcion';

  container.innerHTML = `
    <div class="view__head">
      <div><h1>Pacientes</h1><p>Fichas y datos de contacto</p></div>
      ${puedeEditar ? `<button class="btn btn--primary" id="btnNuevoPaciente">${icon('plus')} Nuevo paciente</button>` : ''}
    </div>

    <div class="card" style="margin-bottom:18px;">
      <div class="field">
        <label for="buscarPaciente">Buscar</label>
        <input id="buscarPaciente" placeholder="Nombre o DNI..." value="${escapeHtml(busqueda)}">
      </div>
    </div>

    <div class="grid grid--2">
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Nombre</th><th>DNI</th><th>Contacto</th><th>Obra social</th><th></th></tr></thead>
          <tbody id="pacientesBody"></tbody>
        </table>
      </div>
      <div class="card" id="detallePaciente">
        <div class="empty-state">${icon('users')}<h4>Elegí un paciente</h4><p>Tocá el ícono de ver para mostrar su ficha acá.</p></div>
      </div>
    </div>
  `;

  document.getElementById('buscarPaciente').addEventListener('input', (e) => { busqueda = e.target.value; pintarLista(); });
  document.getElementById('btnNuevoPaciente')?.addEventListener('click', () => abrirModalPaciente(null));

  pintarLista();
}

function pintarLista(){
  const tbody = document.getElementById('pacientesBody');
  if(!tbody) return;
  const user = currentUser();
  const puedeEditar = user.role === 'admin' || user.role === 'recepcion';
  const q = busqueda.trim().toLowerCase();
  let pacientes = db.getPacientes();
  if(q) pacientes = pacientes.filter((p) => p.nombre.toLowerCase().includes(q) || p.dni.toLowerCase().includes(q));
  pacientes.sort((a, b) => a.nombre.localeCompare(b.nombre));

  if(pacientes.length === 0){
    tbody.innerHTML = `<tr><td colspan="5"><div class="table__empty">No encontramos pacientes con ese criterio.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = pacientes.map((p) => `
    <tr>
      <td class="table__name">${escapeHtml(p.nombre)}</td>
      <td class="table__muted">${escapeHtml(p.dni)}</td>
      <td class="table__muted">${escapeHtml(p.telefono)}</td>
      <td class="table__muted">${escapeHtml(p.obraSocial || 'Particular')}</td>
      <td><div class="table__actions">
        <button class="icon-btn" data-ver="${p.id}" title="Ver ficha">${icon('eye')}</button>
        ${puedeEditar ? `<button class="icon-btn" data-editar="${p.id}" title="Editar">${icon('edit')}</button>` : ''}
      </div></td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-ver]').forEach((btn) => btn.addEventListener('click', () => { pacienteSeleccionado = btn.dataset.ver; pintarDetalle(); }));
  tbody.querySelectorAll('[data-editar]').forEach((btn) => btn.addEventListener('click', () => abrirModalPaciente(btn.dataset.editar)));
}

function pintarDetalle(){
  const panel = document.getElementById('detallePaciente');
  if(!panel || !pacienteSeleccionado) return;
  const paciente = db.getPacientes().find((p) => p.id === pacienteSeleccionado);
  if(!paciente) return;
  const user = currentUser();
  const puedeAgregarNota = user.role === 'profesional' || user.role === 'admin';

  panel.innerHTML = `
    <div class="panel-head">
      <div><h3>${escapeHtml(paciente.nombre)}</h3><p>${escapeHtml(paciente.dni)} · ${escapeHtml(paciente.obraSocial || 'Particular')}</p></div>
    </div>
    <div class="form-grid" style="margin-bottom:18px; font-size:13.5px;">
      <div><strong>Teléfono</strong><br>${escapeHtml(paciente.telefono)}</div>
      <div><strong>Email</strong><br>${escapeHtml(paciente.email)}</div>
      <div><strong>Nacimiento</strong><br>${paciente.nacimiento ? formatFechaLarga(paciente.nacimiento) : '-'}</div>
    </div>
    <div class="panel-head">
      <div><h3 style="font-size:14px;">Historial clínico</h3></div>
      ${puedeAgregarNota ? `<button class="btn btn--soft btn--sm" id="btnAgregarNota">${icon('plus')} Agregar nota</button>` : ''}
    </div>
    <div id="historialLista">
      ${paciente.historial.length === 0 ? '<p class="table__muted">Sin notas cargadas todavía.</p>' :
        [...paciente.historial].reverse().map((h) => `
          <div class="agenda-item" style="align-items:flex-start;">
            <div class="agenda-item__body">
              <p class="agenda-item__title">${formatFechaLarga(h.fecha)}</p>
              <p class="agenda-item__sub">${escapeHtml(h.nota)} — ${escapeHtml(h.profesional)}</p>
            </div>
          </div>`).join('')}
    </div>
  `;

  document.getElementById('btnAgregarNota')?.addEventListener('click', () => {
    document.getElementById('histNota').value = '';
    document.getElementById('histNota').classList.remove('is-invalid');
    document.getElementById('historialError').hidden = true;
    openModal('modalHistorial');
  });
}

export function abrirModalPaciente(id){
  pacienteEditId = id;
  const paciente = id ? db.getPacientes().find((p) => p.id === id) : null;
  document.querySelector('#modalPaciente .modal__head h3').textContent = id ? 'Editar paciente' : 'Nuevo paciente';
  document.getElementById('pacNombre').value = paciente?.nombre || '';
  document.getElementById('pacDni').value = paciente?.dni || '';
  document.getElementById('pacTelefono').value = paciente?.telefono || '';
  document.getElementById('pacEmail').value = paciente?.email || '';
  document.getElementById('pacObraSocial').value = paciente?.obraSocial || '';
  document.getElementById('pacNacimiento').value = paciente?.nacimiento || '';
  document.getElementById('pacienteError').hidden = true;
  document.querySelectorAll('#formPaciente .is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  openModal('modalPaciente');
}

let formsListos = false;
export function initPacientesForms(){
  if(formsListos) return;
  formsListos = true;

  document.getElementById('formPaciente').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!validateForm(e.target, 'Completá los campos obligatorios antes de guardar.')) return;

    const pacientes = db.getPacientes();
    const datos = {
      nombre: document.getElementById('pacNombre').value.trim(),
      dni: document.getElementById('pacDni').value.trim(),
      telefono: document.getElementById('pacTelefono').value.trim(),
      email: document.getElementById('pacEmail').value.trim(),
      obraSocial: document.getElementById('pacObraSocial').value.trim(),
      nacimiento: document.getElementById('pacNacimiento').value,
    };
    if(pacienteEditId){
      const paciente = pacientes.find((p) => p.id === pacienteEditId);
      Object.assign(paciente, datos);
    } else {
      pacientes.push({ id: uid('pac'), historial: [], ...datos });
    }
    db.savePacientes(pacientes);
    closeModal('modalPaciente');
    toast('Datos guardados', 'success');
    if(document.getElementById('pacientesBody')){
      pintarLista();
    } else if(document.getElementById('miPerfilCard')){
      const { renderPerfil } = await import('./perfil.js');
      renderPerfil(document.getElementById('viewContainer'), currentUser());
    }
  });

  document.getElementById('formHistorial').addEventListener('submit', (e) => {
    e.preventDefault();
    if(!validateForm(e.target, 'Escribí una nota antes de guardar.')) return;
    if(!pacienteSeleccionado) return;
    const pacientes = db.getPacientes();
    const paciente = pacientes.find((p) => p.id === pacienteSeleccionado);
    const user = currentUser();
    paciente.historial.push({ fecha: todayISO(), nota: document.getElementById('histNota').value.trim(), profesional: user?.nombre || 'Equipo Vitta' });
    db.savePacientes(pacientes);
    closeModal('modalHistorial');
    toast('Nota agregada al historial', 'success');
    if(document.getElementById('detallePaciente')) pintarDetalle();
  });
}
