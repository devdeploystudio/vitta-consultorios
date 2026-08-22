import { db } from './store.js';
import { icon } from './ui.js';
import { abrirModalPaciente } from './pacientes.js';
import { escapeHtml, formatFechaLarga } from './utils.js';

export function renderPerfil(container, user){
  const paciente = db.getPacientes().find((p) => p.id === user.pacienteId);

  if(!paciente){
    container.innerHTML = `<div class="empty-state">${icon('user')}<h4>No encontramos tu ficha</h4><p>Consultá con recepción para vincular tu cuenta.</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="view__head">
      <div><h1>Mi perfil</h1><p>Tus datos de contacto y tu historial clínico</p></div>
      <button class="btn btn--ghost" id="btnEditarPerfil">${icon('edit')} Editar mis datos</button>
    </div>

    <div class="grid grid--2">
      <div class="card" id="miPerfilCard">
        <div class="panel-head"><div><h3>${escapeHtml(paciente.nombre)}</h3><p>DNI ${escapeHtml(paciente.dni)}</p></div></div>
        <div class="form-grid" style="font-size:13.5px;">
          <div><strong>Teléfono</strong><br>${escapeHtml(paciente.telefono)}</div>
          <div><strong>Email</strong><br>${escapeHtml(paciente.email)}</div>
          <div><strong>Obra social</strong><br>${escapeHtml(paciente.obraSocial || 'Particular')}</div>
          <div><strong>Nacimiento</strong><br>${paciente.nacimiento ? formatFechaLarga(paciente.nacimiento) : '-'}</div>
        </div>
      </div>

      <div class="card">
        <div class="panel-head"><div><h3>Historial clínico</h3><p>Cargado por tu profesional tratante</p></div></div>
        ${paciente.historial.length === 0 ? '<p class="table__muted">Todavía no hay notas cargadas.</p>' :
          [...paciente.historial].reverse().map((h) => `
            <div class="agenda-item" style="align-items:flex-start;">
              <div class="agenda-item__body">
                <p class="agenda-item__title">${formatFechaLarga(h.fecha)}</p>
                <p class="agenda-item__sub">${escapeHtml(h.nota)} — ${escapeHtml(h.profesional)}</p>
              </div>
            </div>`).join('')}
      </div>
    </div>
  `;

  document.getElementById('btnEditarPerfil').addEventListener('click', () => abrirModalPaciente(paciente.id));
}
