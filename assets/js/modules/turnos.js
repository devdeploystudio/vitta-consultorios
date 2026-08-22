import { db } from './store.js';
import { HORARIOS } from './data.js';
import { icon, toast, openModal, closeModal, confirmDialog } from './ui.js';
import { notificar } from './notifications.js';
import { currentUser } from './auth.js';
import { validateForm } from './validation.js';
import { uid, todayISO, relativoDia, escapeHtml } from './utils.js';

let filtro = { fecha: '', estado: '', profesionalId: '' };

export function renderTurnos(container, user){
  if(user.role === 'paciente'){
    renderTurnosPaciente(container, user);
    return;
  }

  filtro = { fecha: filtro.fecha, estado: filtro.estado, profesionalId: user.role === 'profesional' ? user.profesionalId : filtro.profesionalId };

  const profesionales = db.getProfesionales();

  container.innerHTML = `
    <div class="view__head">
      <div>
        <h1>Turnos</h1>
        <p>Agenda de todo el consultorio</p>
      </div>
      <button class="btn btn--primary" id="btnNuevoTurno">${icon('plus')} Nuevo turno</button>
    </div>

    <div class="card" style="margin-bottom:18px;">
      <div class="form-grid form-grid--cols-4">
        <div class="field">
          <label for="filtroFecha">Fecha</label>
          <input type="date" id="filtroFecha" value="${filtro.fecha}">
        </div>
        <div class="field">
          <label for="filtroEstado">Estado</label>
          <select id="filtroEstado">
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="atendido">Atendido</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        ${user.role !== 'profesional' ? `
          <div class="field">
            <label for="filtroProfesional">Profesional</label>
            <select id="filtroProfesional">
              <option value="">Todos</option>
              ${profesionales.map((p) => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`).join('')}
            </select>
          </div>
        ` : '<div></div>'}
        <div class="field">
          <label>&nbsp;</label>
          <button class="btn btn--ghost btn--block" id="btnLimpiarFiltro" type="button">Quitar filtros</button>
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th><th>Hora</th><th>Paciente</th><th>Profesional</th><th>Motivo</th><th>Estado</th><th></th>
          </tr>
        </thead>
        <tbody id="turnosBody"></tbody>
      </table>
    </div>
  `;

  document.getElementById('filtroFecha').value = filtro.fecha;
  document.getElementById('filtroEstado').value = filtro.estado;
  const selectProf = document.getElementById('filtroProfesional');
  if(selectProf) selectProf.value = filtro.profesionalId;

  document.getElementById('filtroFecha').addEventListener('change', (e) => { filtro.fecha = e.target.value; pintarTabla(user); });
  document.getElementById('filtroEstado').addEventListener('change', (e) => { filtro.estado = e.target.value; pintarTabla(user); });
  selectProf?.addEventListener('change', (e) => { filtro.profesionalId = e.target.value; pintarTabla(user); });
  document.getElementById('btnLimpiarFiltro').addEventListener('click', () => {
    filtro = { fecha: '', estado: '', profesionalId: user.role === 'profesional' ? user.profesionalId : '' };
    document.getElementById('filtroFecha').value = '';
    document.getElementById('filtroEstado').value = '';
    if(selectProf) selectProf.value = '';
    pintarTabla(user);
  });

  document.getElementById('btnNuevoTurno').addEventListener('click', () => abrirModalNuevoTurno(user));

  pintarTabla(user);
}

function pintarTabla(user){
  const tbody = document.getElementById('turnosBody');
  if(!tbody) return;

  const pacientes = db.getPacientes();
  const profesionales = db.getProfesionales();
  let turnos = db.getTurnos();

  if(filtro.fecha) turnos = turnos.filter((t) => t.fecha === filtro.fecha);
  if(filtro.estado) turnos = turnos.filter((t) => t.estado === filtro.estado);
  if(filtro.profesionalId) turnos = turnos.filter((t) => t.profesionalId === filtro.profesionalId);

  turnos.sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  if(turnos.length === 0){
    tbody.innerHTML = `<tr><td colspan="7"><div class="table__empty">No hay turnos que coincidan con el filtro.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = turnos.map((t) => {
    const paciente = pacientes.find((p) => p.id === t.pacienteId);
    const prof = profesionales.find((p) => p.id === t.profesionalId);
    const puedeGestionar = user.role === 'admin' || user.role === 'recepcion' || (user.role === 'profesional' && t.profesionalId === user.profesionalId);
    return `
      <tr>
        <td>${relativoDia(t.fecha)}</td>
        <td class="table__name">${t.hora}</td>
        <td>${escapeHtml(paciente?.nombre || 'Paciente eliminado')}</td>
        <td class="table__muted">${escapeHtml(prof?.nombre || '')}</td>
        <td class="table__muted">${escapeHtml(t.motivo)}</td>
        <td><span class="badge badge--${t.estado}">${t.estado}</span></td>
        <td>
          <div class="table__actions">
            ${puedeGestionar && t.estado === 'pendiente' ? `<button class="icon-btn" data-accion="confirmar" data-id="${t.id}" title="Confirmar">${icon('check')}</button>` : ''}
            ${puedeGestionar && (t.estado === 'pendiente' || t.estado === 'confirmado') ? `<button class="icon-btn" data-accion="atender" data-id="${t.id}" title="Marcar atendido">${icon('eye')}</button>` : ''}
            ${puedeGestionar && t.estado !== 'cancelado' && t.estado !== 'atendido' ? `<button class="icon-btn" data-accion="cancelar" data-id="${t.id}" title="Cancelar">${icon('ban')}</button>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-accion]').forEach((btn) => {
    btn.addEventListener('click', () => manejarAccion(btn.dataset.accion, btn.dataset.id, user));
  });
}

function manejarAccion(accion, turnoId, user){
  const turnos = db.getTurnos();
  const turno = turnos.find((t) => t.id === turnoId);
  if(!turno) return;
  const paciente = db.getPacientes().find((p) => p.id === turno.pacienteId);

  if(accion === 'confirmar'){
    turno.estado = 'confirmado';
    db.saveTurnos(turnos);
    notificar(`Se envió un mail a ${paciente?.nombre || 'el paciente'} confirmando el turno del ${turno.fecha} a las ${turno.hora}.`);
    toast('Turno confirmado', 'success');
    pintarTabla(user);
  } else if(accion === 'atender'){
    turno.estado = 'atendido';
    db.saveTurnos(turnos);
    toast('Turno marcado como atendido', 'success');
    pintarTabla(user);
  } else if(accion === 'cancelar'){
    confirmDialog(`¿Cancelar el turno de ${paciente?.nombre || 'el paciente'} del ${turno.fecha} a las ${turno.hora}?`, () => {
      turno.estado = 'cancelado';
      db.saveTurnos(turnos);
      notificar(`Se envió un mail a ${paciente?.nombre || 'el paciente'} avisando que su turno del ${turno.fecha} fue cancelado.`);
      toast('Turno cancelado', 'info');
      pintarTabla(user);
    });
  }
}

function abrirModalNuevoTurno(user, pacienteFijo){
  const pacientes = db.getPacientes();
  const profesionales = db.getProfesionales();

  document.getElementById('modalTurnoTitle').textContent = 'Nuevo turno';
  document.getElementById('turnoError').hidden = true;
  document.querySelectorAll('#formTurno .is-invalid').forEach((el) => el.classList.remove('is-invalid'));

  const campoPaciente = document.getElementById('campoPaciente');
  const selectPaciente = document.getElementById('turnoPaciente');
  if(pacienteFijo){
    campoPaciente.hidden = true;
    selectPaciente.innerHTML = `<option value="${pacienteFijo}">fijo</option>`;
    selectPaciente.value = pacienteFijo;
  } else {
    campoPaciente.hidden = false;
    selectPaciente.innerHTML = pacientes.map((p) => `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`).join('');
  }

  const selectProfesional = document.getElementById('turnoProfesional');
  const listaProfesionales = user.role === 'profesional' ? profesionales.filter((p) => p.id === user.profesionalId) : profesionales;
  selectProfesional.innerHTML = listaProfesionales.map((p) => `<option value="${p.id}">${escapeHtml(p.nombre)} · ${escapeHtml(p.especialidad)}</option>`).join('');

  const selectHora = document.getElementById('turnoHora');
  selectHora.innerHTML = HORARIOS.map((h) => `<option value="${h}">${h}</option>`).join('');

  document.getElementById('turnoFecha').value = todayISO();
  document.getElementById('turnoFecha').min = todayISO();
  document.getElementById('turnoMotivo').value = '';

  openModal('modalTurno');
}

// para el atajo del panel: "Solicitar turno" navega a Turnos y de una abre el modal
export function solicitarTurnoPaciente(user){
  abrirModalNuevoTurno(user, user.pacienteId);
}

function initFormTurno(){
  const form = document.getElementById('formTurno');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!validateForm(form, 'Completá todos los campos para agendar el turno.')) return;

    const user = currentUser();
    const pacienteId = document.getElementById('turnoPaciente').value;
    const profesionalId = document.getElementById('turnoProfesional').value;
    const fecha = document.getElementById('turnoFecha').value;
    const hora = document.getElementById('turnoHora').value;
    const motivo = document.getElementById('turnoMotivo').value.trim();
    const errorEl = document.getElementById('turnoError');

    const turnos = db.getTurnos();
    const ocupado = turnos.some((t) => t.profesionalId === profesionalId && t.fecha === fecha && t.hora === hora && t.estado !== 'cancelado');
    if(ocupado){
      errorEl.textContent = 'Ese profesional ya tiene un turno en ese horario. Elegí otro.';
      errorEl.hidden = false;
      return;
    }
    errorEl.hidden = true;

    const nuevo = {
      id: uid('t'),
      pacienteId,
      profesionalId,
      fecha,
      hora,
      motivo: motivo || 'Consulta general',
      estado: 'pendiente',
      creadoEn: new Date().toISOString(),
      notificado: true,
    };
    turnos.push(nuevo);
    db.saveTurnos(turnos);

    const paciente = db.getPacientes().find((p) => p.id === pacienteId);
    notificar(`Se envió un mail a ${paciente?.nombre || 'el paciente'} con la confirmación del turno del ${fecha} a las ${hora}.`);
    toast('Turno agendado correctamente', 'success');
    closeModal('modalTurno');

    const container = document.getElementById('viewContainer');
    if(user.role === 'paciente'){
      renderTurnosPaciente(container, user);
    } else if(document.getElementById('turnosBody')){
      pintarTabla(user);
    }
  });
}

let formTurnoListo = false;
export function initTurnosForm(){
  if(formTurnoListo) return;
  formTurnoListo = true;
  initFormTurno();
}

// ---------------- vista para el rol paciente ----------------

function renderTurnosPaciente(container, user){
  const turnos = db.getTurnos()
    .filter((t) => t.pacienteId === user.pacienteId)
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const profesionales = db.getProfesionales();

  container.innerHTML = `
    <div class="view__head">
      <div>
        <h1>Mis turnos</h1>
        <p>Pedí un turno nuevo o revisá los que ya tenés.</p>
      </div>
      <button class="btn btn--primary" id="btnNuevoTurnoPaciente">${icon('plus')} Solicitar turno</button>
    </div>

    <div class="card">
      ${turnos.length === 0 ? `
        <div class="empty-state">${icon('calendar')}<h4>Todavía no pediste ningún turno</h4><p>Usá el botón de arriba para solicitar el primero.</p></div>
      ` : turnos.map((t) => {
        const prof = profesionales.find((p) => p.id === t.profesionalId);
        const puedeCancelar = (t.estado === 'pendiente' || t.estado === 'confirmado') && t.fecha >= todayISO();
        return `
          <div class="agenda-item">
            <span class="agenda-item__time">${t.hora}</span>
            <span class="agenda-item__bar"></span>
            <div class="agenda-item__body">
              <p class="agenda-item__title">${escapeHtml(prof?.nombre || '')} · ${escapeHtml(prof?.especialidad || '')}</p>
              <p class="agenda-item__sub">${relativoDia(t.fecha)} · ${escapeHtml(t.motivo)}</p>
            </div>
            <span class="badge badge--${t.estado}">${t.estado}</span>
            ${puedeCancelar ? `<div class="table__actions"><button class="icon-btn" data-cancelar-propio="${t.id}" title="Cancelar">${icon('ban')}</button></div>` : ''}
          </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('btnNuevoTurnoPaciente').addEventListener('click', () => abrirModalNuevoTurno(user, user.pacienteId));

  container.querySelectorAll('[data-cancelar-propio]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const turnos = db.getTurnos();
      const turno = turnos.find((t) => t.id === btn.dataset.cancelarPropio);
      confirmDialog(`¿Cancelar tu turno del ${turno.fecha} a las ${turno.hora}?`, () => {
        turno.estado = 'cancelado';
        db.saveTurnos(turnos);
        notificar(`Se envió un mail confirmando la cancelación de tu turno del ${turno.fecha}.`);
        toast('Turno cancelado', 'info');
        renderTurnosPaciente(container, user);
      });
    });
  });
}
