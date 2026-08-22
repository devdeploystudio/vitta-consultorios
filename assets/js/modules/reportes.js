import { db } from './store.js';
import { icon, toast } from './ui.js';
import { downloadBlob, todayISO, addDays, formatFecha, formatFechaLarga, escapeHtml } from './utils.js';

let dataset = 'turnos';
let rango = { desde: addDays(todayISO(), -7), hasta: addDays(todayISO(), 7), estado: '' };

// el orden en que se agrupan los turnos en el reporte: primero lo ya resuelto,
// despues lo que sigue en pie, al final lo cancelado
const GRUPOS_ESTADO = [
  { estado: 'atendido', label: 'Atendidos' },
  { estado: 'confirmado', label: 'Confirmados' },
  { estado: 'pendiente', label: 'Pendientes' },
  { estado: 'cancelado', label: 'Cancelados' },
];

export function renderReportes(container){
  container.innerHTML = `
    <div class="view__head">
      <div><h1>Reportes</h1><p>Exportá la información a Excel o a PDF</p></div>
    </div>

    <div class="tabs">
      <button class="tab ${dataset === 'turnos' ? 'is-active' : ''}" data-tab="turnos">Turnos</button>
      <button class="tab ${dataset === 'pacientes' ? 'is-active' : ''}" data-tab="pacientes">Pacientes</button>
    </div>

    <div class="card" style="margin-bottom:18px;">
      <div class="form-grid ${dataset === 'pacientes' ? 'form-grid--cols-1' : 'form-grid--cols-4'}">
        ${dataset === 'pacientes' ? '' : `
          <div class="field" id="repDesde">
            <label for="repFechaDesde">Desde</label>
            <input type="date" id="repFechaDesde" value="${rango.desde}">
          </div>
          <div class="field" id="repHasta">
            <label for="repFechaHasta">Hasta</label>
            <input type="date" id="repFechaHasta" value="${rango.hasta}">
          </div>
          <div class="field" id="repEstado">
            <label for="repFiltroEstado">Estado</label>
            <select id="repFiltroEstado">
              <option value="">Todos, agrupados</option>
              <option value="pendiente">Solo pendientes</option>
              <option value="confirmado">Solo confirmados</option>
              <option value="atendido">Solo atendidos</option>
              <option value="cancelado">Solo cancelados</option>
            </select>
          </div>
        `}
        <div class="field">
          <label>&nbsp;</label>
          <div style="display:flex; gap:10px;">
            <button class="btn btn--soft" id="btnExportCsv">${icon('download')} Excel</button>
            <button class="btn btn--ghost" id="btnExportPdf">${icon('book')} PDF</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="print-area">
        <div class="report-print-header" id="reportePrintHeader"></div>
        <div class="table-wrap" id="reportePreview"></div>
      </div>
    </div>
  `;

  const selectEstado = document.getElementById('repFiltroEstado');
  if(selectEstado) selectEstado.value = rango.estado;

  container.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => { dataset = tab.dataset.tab; renderReportes(container); });
  });

  document.getElementById('repFechaDesde')?.addEventListener('change', (e) => { rango.desde = e.target.value; pintarPreview(); });
  document.getElementById('repFechaHasta')?.addEventListener('change', (e) => { rango.hasta = e.target.value; pintarPreview(); });
  document.getElementById('repFiltroEstado')?.addEventListener('change', (e) => { rango.estado = e.target.value; pintarPreview(); });

  document.getElementById('btnExportCsv').addEventListener('click', exportarExcel);
  document.getElementById('btnExportPdf').addEventListener('click', () => window.print());

  pintarPreview();
}

function filasTurnos(){
  const pacientes = db.getPacientes();
  const profesionales = db.getProfesionales();
  return db.getTurnos()
    .filter((t) => t.fecha >= rango.desde && t.fecha <= rango.hasta && (!rango.estado || t.estado === rango.estado))
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .map((t) => ({
      fecha: t.fecha,
      hora: t.hora,
      paciente: pacientes.find((p) => p.id === t.pacienteId)?.nombre || '',
      profesional: profesionales.find((p) => p.id === t.profesionalId)?.nombre || '',
      motivo: t.motivo,
      estado: t.estado,
    }));
}

function agruparTurnos(filas){
  return GRUPOS_ESTADO
    .map((g) => ({ ...g, filas: filas.filter((f) => f.estado === g.estado) }))
    .filter((g) => g.filas.length > 0);
}

function filasPacientes(){
  return db.getPacientes()
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((p) => ({
      nombre: p.nombre, dni: p.dni, telefono: p.telefono, email: p.email, obraSocial: p.obraSocial || '',
    }));
}

function pintarPreview(){
  const el = document.getElementById('reportePreview');
  if(!el) return;

  const header = document.getElementById('reportePrintHeader');
  header.innerHTML = `
    <div class="report-print-brand"><svg viewBox="0 0 24 24"><path d="M3 12h4l2-6 3 12 3-9 2 3h4"/></svg>VITTA</div>
    <div class="report-print-meta">${dataset === 'turnos' ? 'Reporte de turnos' : 'Reporte de pacientes'} · Generado el ${formatFechaLarga(todayISO())}</div>
  `;

  if(dataset === 'turnos'){
    const grupos = agruparTurnos(filasTurnos());
    if(grupos.length === 0){
      el.innerHTML = `<div class="table__empty">Sin turnos en ese rango.</div>`;
      return;
    }
    el.innerHTML = `
      <table class="table report-table">
        <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Profesional</th><th>Motivo</th><th>Estado</th></tr></thead>
        <tbody>
          ${grupos.map((g) => `
            <tr class="report-group-row"><td colspan="6">${g.label} <span class="report-group-count">(${g.filas.length})</span></td></tr>
            ${g.filas.map((f) => `
              <tr>
                <td class="report-cell-date">${formatFecha(f.fecha)}</td><td>${f.hora}</td><td>${escapeHtml(f.paciente)}</td>
                <td>${escapeHtml(f.profesional)}</td><td>${escapeHtml(f.motivo)}</td>
                <td><span class="badge badge--${f.estado}">${f.estado}</span></td>
              </tr>`).join('')}
          `).join('')}
        </tbody>
      </table>`;
  } else {
    const filas = filasPacientes();
    el.innerHTML = `
      <table class="table report-table">
        <thead><tr><th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Email</th><th>Obra social</th></tr></thead>
        <tbody>
          ${filas.map((f) => `<tr><td>${escapeHtml(f.nombre)}</td><td>${escapeHtml(f.dni)}</td><td>${escapeHtml(f.telefono)}</td><td>${escapeHtml(f.email)}</td><td>${escapeHtml(f.obraSocial)}</td></tr>`).join('')}
        </tbody>
      </table>`;
  }
}

// el color de cada estado en el excel, igual criterio que las badges de la app
const COLOR_ESTADO = {
  atendido: '#2f9e63', confirmado: '#0a5245', pendiente: '#c98a1f', cancelado: '#c94b3f',
};

function construirExcelTurnos(){
  const grupos = agruparTurnos(filasTurnos());
  const filasHtml = grupos.map((g) => `
    <tr><td colspan="6" class="grupo">${g.label} (${g.filas.length})</td></tr>
    <tr class="col"><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Profesional</th><th>Motivo</th><th>Estado</th></tr>
    ${g.filas.map((f) => `
      <tr>
        <td>${formatFecha(f.fecha)}</td><td>${f.hora}</td><td>${escapeHtml(f.paciente)}</td>
        <td>${escapeHtml(f.profesional)}</td><td>${escapeHtml(f.motivo)}</td>
        <td style="color:${COLOR_ESTADO[f.estado]}; font-weight:bold; text-transform:uppercase;">${f.estado}</td>
      </tr>`).join('')}
  `).join('');

  return { filasHtml, colspan: 6 };
}

function construirExcelPacientes(){
  const filas = filasPacientes();
  const filasHtml = `
    <tr class="col"><th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Email</th><th>Obra social</th></tr>
    ${filas.map((f) => `<tr><td>${escapeHtml(f.nombre)}</td><td>${escapeHtml(f.dni)}</td><td>${escapeHtml(f.telefono)}</td><td>${escapeHtml(f.email)}</td><td>${escapeHtml(f.obraSocial)}</td></tr>`).join('')}
  `;
  return { filasHtml, colspan: 5 };
}

function exportarExcel(){
  const { filasHtml, colspan } = dataset === 'turnos' ? construirExcelTurnos() : construirExcelPacientes();
  const titulo = dataset === 'turnos' ? 'Reporte de turnos' : 'Reporte de pacientes';
  const nombreArchivo = `vitta-${dataset}-${todayISO()}.xls`;

  const html = `<!doctype html>
<html><head><meta charset="UTF-8">
<style>
  table{ border-collapse:collapse; font-family:Calibri,Arial,sans-serif; }
  td, th{ padding:7px 14px; font-size:12px; border:1px solid #d7e4e0; }
  .marca{ background:#0e6b5c; color:#ffffff; font-size:18px; font-weight:bold; padding:14px; border:none; }
  .meta{ color:#5c6d68; font-size:11px; padding:2px 14px 14px; border:none; }
  .grupo{ background:#e3f2ee; color:#0a5245; font-weight:bold; font-size:13px; text-transform:uppercase; }
  tr.col th{ background:#0e6b5c; color:#ffffff; text-align:left; font-size:11.5px; text-transform:uppercase; }
</style></head>
<body>
<table>
  <tr><td colspan="${colspan}" class="marca">VITTA</td></tr>
  <tr><td colspan="${colspan}" class="meta">${titulo} · Generado el ${formatFechaLarga(todayISO())}</td></tr>
  ${filasHtml}
</table>
</body></html>`;

  downloadBlob(nombreArchivo, html, 'application/vnd.ms-excel;charset=utf-8;');
  toast('Reporte exportado a Excel', 'success');
}
