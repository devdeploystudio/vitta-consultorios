import { db } from './store.js';
import { icon } from './ui.js';
import { todayISO, addDays, formatFecha, relativoDia, escapeHtml } from './utils.js';

function turnosVisibles(user){
  const turnos = db.getTurnos();
  if(user.role === 'profesional') return turnos.filter((t) => t.profesionalId === user.profesionalId);
  if(user.role === 'paciente') return turnos.filter((t) => t.pacienteId === user.pacienteId);
  return turnos;
}

export function renderDashboard(container, user){
  if(user.role === 'paciente'){
    renderDashboardPaciente(container, user);
    return;
  }

  const turnos = turnosVisibles(user);
  const pacientes = db.getPacientes();
  const profesionales = db.getProfesionales();
  const hoy = todayISO();

  const turnosHoy = turnos.filter((t) => t.fecha === hoy && t.estado !== 'cancelado');
  const semanaInicio = hoy;
  const semanaFin = addDays(hoy, 6);
  const turnosSemana = turnos.filter((t) => t.fecha >= semanaInicio && t.fecha <= semanaFin && t.estado !== 'cancelado');
  const pendientes = turnos.filter((t) => t.estado === 'pendiente').length;

  const slotsPorDia = profesionales.length * 10;
  const ocupacionHoy = slotsPorDia ? Math.min(100, Math.round((turnosHoy.length / slotsPorDia) * 100)) : 0;

  const dias = Array.from({ length: 7 }, (_, i) => addDays(addDays(hoy, -6), i));
  const maxDia = Math.max(1, ...dias.map((d) => turnos.filter((t) => t.fecha === d && t.estado !== 'cancelado').length));

  const proximos = turnos
    .filter((t) => t.fecha >= hoy && t.estado !== 'cancelado')
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 6);

  container.innerHTML = `
    <div class="view__head">
      <div>
        <h1>Hola, ${escapeHtml(user.nombre.split(' ')[0])}</h1>
        <p>Así viene la actividad del consultorio esta semana.</p>
      </div>
    </div>

    <div class="grid grid--metrics" style="margin-bottom:20px;">
      <div class="metric">
        <div class="metric__top"><span class="metric__label">Turnos hoy</span><span class="metric__icon">${icon('calendar')}</span></div>
        <span class="metric__value">${turnosHoy.length}</span>
        <span class="metric__delta up">${relativoDia(hoy)}</span>
      </div>
      <div class="metric">
        <div class="metric__top"><span class="metric__label">Turnos esta semana</span><span class="metric__icon">${icon('grid')}</span></div>
        <span class="metric__value">${turnosSemana.length}</span>
        <span class="metric__delta up">Próximos 7 días</span>
      </div>
      <div class="metric">
        <div class="metric__top"><span class="metric__label">Pendientes de confirmar</span><span class="metric__icon">${icon('clock')}</span></div>
        <span class="metric__value">${pendientes}</span>
        <span class="metric__delta ${pendientes > 3 ? 'down' : 'up'}">${pendientes > 3 ? 'Revisar agenda' : 'Bajo control'}</span>
      </div>
      <div class="metric">
        <div class="metric__top"><span class="metric__label">Ocupación de hoy</span><span class="metric__icon">${icon('users')}</span></div>
        <span class="metric__value">${ocupacionHoy}%</span>
        <span class="metric__delta up">${profesionales.length} profesionales activos</span>
      </div>
    </div>

    <div class="grid grid--2">
      <div class="card">
        <div class="panel-head">
          <div>
            <h3>Turnos por día</h3>
            <p>Últimos 7 días, incluye hoy</p>
          </div>
        </div>
        <div class="bar-chart">
          ${dias.map((d) => {
            const cant = turnos.filter((t) => t.fecha === d && t.estado !== 'cancelado').length;
            const h = Math.max(6, Math.round((cant / maxDia) * 130));
            return `
              <div class="bar-chart__col">
                <div class="bar-chart__bar ${d === hoy ? 'is-today' : ''}" style="height:${h}px" title="${cant} turnos"></div>
                <span class="bar-chart__label">${formatFecha(d).slice(0, 3)}</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="panel-head">
          <div>
            <h3>Próximos turnos</h3>
            <p>Los que siguen en la agenda</p>
          </div>
        </div>
        ${proximos.length === 0 ? `
          <div class="empty-state">${icon('calendar')}<h4>Sin turnos próximos</h4><p>Todavía no hay nada cargado.</p></div>
        ` : proximos.map((t) => {
          const paciente = pacientes.find((p) => p.id === t.pacienteId);
          const prof = profesionales.find((p) => p.id === t.profesionalId);
          return `
            <div class="agenda-item">
              <span class="agenda-item__time">${t.hora}</span>
              <span class="agenda-item__bar"></span>
              <div class="agenda-item__body">
                <p class="agenda-item__title">${escapeHtml(paciente?.nombre || 'Paciente')}</p>
                <p class="agenda-item__sub">${relativoDia(t.fecha)} · ${escapeHtml(prof?.nombre || '')}</p>
              </div>
              <span class="badge badge--${t.estado}">${t.estado}</span>
            </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderDashboardPaciente(container, user){
  const turnos = turnosVisibles(user).filter((t) => t.estado !== 'cancelado');
  const hoy = todayISO();
  const proximos = turnos.filter((t) => t.fecha >= hoy).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const profesionales = db.getProfesionales();

  container.innerHTML = `
    <div class="view__head">
      <div>
        <h1>Hola, ${escapeHtml(user.nombre.split(' ')[0])}</h1>
        <p>Este es tu resumen en Vitta.</p>
      </div>
      <button class="btn btn--primary" id="dashBtnSolicitar">${icon('plus')} Solicitar turno</button>
    </div>

    <div class="card">
      <div class="panel-head">
        <div><h3>Tus próximos turnos</h3><p>Te avisamos por mail antes de cada uno</p></div>
      </div>
      ${proximos.length === 0 ? `
        <div class="empty-state">${icon('calendar')}<h4>No tenés turnos agendados</h4><p>Pedí uno nuevo cuando quieras.</p></div>
      ` : proximos.map((t) => {
        const prof = profesionales.find((p) => p.id === t.profesionalId);
        return `
          <div class="agenda-item">
            <span class="agenda-item__time">${t.hora}</span>
            <span class="agenda-item__bar"></span>
            <div class="agenda-item__body">
              <p class="agenda-item__title">${escapeHtml(prof?.nombre || '')}</p>
              <p class="agenda-item__sub">${relativoDia(t.fecha)} · ${escapeHtml(t.motivo)}</p>
            </div>
            <span class="badge badge--${t.estado}">${t.estado}</span>
          </div>`;
      }).join('')}
    </div>
  `;

  document.getElementById('dashBtnSolicitar')?.addEventListener('click', async () => {
    const { navigate } = await import('./router.js');
    const { solicitarTurnoPaciente } = await import('./turnos.js');
    navigate('turnos');
    solicitarTurnoPaciente(user);
  });
}
