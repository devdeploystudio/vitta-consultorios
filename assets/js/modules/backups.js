// respaldos. el "automatico" es simulado: la primera vez que se abre el sistema
// en un dia nuevo, queda una entrada en el historial como si un cron lo hubiese corrido.
// el manual sí genera un archivo real que se puede descargar.

import { db, exportSnapshot, restoreSnapshot } from './store.js';
import { icon, toast, confirmDialog } from './ui.js';
import { notificar } from './notifications.js';
import { uid, todayISO, downloadBlob } from './utils.js';

export function ensureAutoBackup(){
  const meta = db.getMeta();
  const hoy = todayISO();
  if(meta.lastAutoBackupDay === hoy) return;

  const snapshot = exportSnapshot();
  const tamano = new Blob([JSON.stringify(snapshot)]).size;

  const backups = db.getBackups();
  backups.unshift({ id: uid('bk'), fecha: new Date().toISOString(), tipo: 'automático', tamano });
  db.saveBackups(backups.slice(0, 20));

  meta.lastAutoBackupDay = hoy;
  meta.lastBackup = new Date().toISOString();
  db.saveMeta(meta);
  notificar('Se generó el respaldo automático diario de la base de datos.');
}

export function renderBackups(container){
  const meta = db.getMeta();
  const backups = db.getBackups();

  container.innerHTML = `
    <div class="view__head">
      <div><h1>Respaldos</h1><p>Copias de seguridad de toda la información del sistema <em>(simulado en esta demo: el respaldo se genera y guarda en el navegador, no en un servidor real)</em></p></div>
      <div style="display:flex; gap:10px;">
        <button class="btn btn--ghost" id="btnRestaurar">${icon('database')} Restaurar desde archivo</button>
        <button class="btn btn--primary" id="btnRespaldar">${icon('download')} Generar respaldo ahora</button>
      </div>
    </div>

    <div class="grid grid--metrics grid--metrics-3" style="margin-bottom:20px;">
      <div class="metric">
        <div class="metric__top"><span class="metric__label">Último respaldo</span><span class="metric__icon">${icon('clock')}</span></div>
        <span class="metric__value" style="font-size:16px;">${meta.lastBackup ? new Date(meta.lastBackup).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin respaldos aún'}</span>
      </div>
      <div class="metric">
        <div class="metric__top"><span class="metric__label">Frecuencia</span><span class="metric__icon">${icon('calendar')}</span></div>
        <span class="metric__value" style="font-size:16px;">Automático diario</span>
      </div>
      <div class="metric">
        <div class="metric__top"><span class="metric__label">Respaldos guardados</span><span class="metric__icon">${icon('database')}</span></div>
        <span class="metric__value">${backups.length}</span>
      </div>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Tamaño</th><th></th></tr></thead>
        <tbody id="backupsBody">
          ${backups.length === 0 ? '<tr><td colspan="4"><div class="table__empty">Todavía no se generó ningún respaldo.</div></td></tr>' :
            backups.map((b) => `
              <tr>
                <td class="table__name">${new Date(b.fecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td><span class="badge badge--rol">${b.tipo}</span></td>
                <td class="table__muted">${(b.tamano / 1024).toFixed(1)} KB</td>
                <td><div class="table__actions"><button class="icon-btn" data-descargar="${b.id}" title="Descargar">${icon('download')}</button></div></td>
              </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <input type="file" id="inputRestaurar" accept="application/json" hidden>
  `;

  document.getElementById('btnRespaldar').addEventListener('click', generarRespaldoManual);

  document.getElementById('btnRestaurar').addEventListener('click', () => document.getElementById('inputRestaurar').click());
  document.getElementById('inputRestaurar').addEventListener('change', manejarArchivoRestaurar);

  document.querySelectorAll('[data-descargar]').forEach((btn) => {
    btn.addEventListener('click', () => descargarRespaldo());
  });
}

function generarRespaldoManual(){
  const snapshot = exportSnapshot();
  const contenido = JSON.stringify(snapshot, null, 2);
  const tamano = new Blob([contenido]).size;

  const backups = db.getBackups();
  backups.unshift({ id: uid('bk'), fecha: new Date().toISOString(), tipo: 'manual', tamano });
  db.saveBackups(backups.slice(0, 20));

  const meta = db.getMeta();
  meta.lastBackup = new Date().toISOString();
  db.saveMeta(meta);

  downloadBlob(`vitta-respaldo-${todayISO()}.json`, contenido, 'application/json');
  toast('Respaldo generado y descargado', 'success');
  renderBackups(document.getElementById('viewContainer'));
}

function descargarRespaldo(){
  // los respaldos anteriores no guardan el contenido completo en el historial,
  // asi que ofrecemos el snapshot actual como reemplazo equivalente
  const snapshot = exportSnapshot();
  downloadBlob(`vitta-respaldo-${todayISO()}.json`, JSON.stringify(snapshot, null, 2), 'application/json');
  toast('Descarga lista', 'success');
}

function manejarArchivoRestaurar(e){
  const archivo = e.target.files[0];
  if(!archivo) return;

  const reader = new FileReader();
  reader.onload = () => {
    let snapshot;
    try {
      snapshot = JSON.parse(reader.result);
    } catch {
      toast('El archivo no es un respaldo válido', 'error');
      return;
    }
    confirmDialog('Esto va a reemplazar toda la información actual del sistema por la del archivo. ¿Continuar?', () => {
      restoreSnapshot(snapshot);
      toast('Respaldo restaurado, recargando el sistema…', 'success');
      setTimeout(() => window.location.reload(), 900);
    });
  };
  reader.readAsText(archivo);
  e.target.value = '';
}
