// helpers chicos que se usan en varios modulos, nada especial

let seq = 0;
export function uid(prefix){
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}${seq}`;
}

export function todayISO(){
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso, n){
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatFecha(iso){
  const d = new Date(iso + 'T00:00:00');
  return `${DIAS[d.getDay()]}. ${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function formatFechaLarga(iso){
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function relativoDia(iso){
  const hoy = todayISO();
  if(iso === hoy) return 'Hoy';
  if(iso === addDays(hoy, 1)) return 'Mañana';
  if(iso === addDays(hoy, -1)) return 'Ayer';
  return formatFecha(iso);
}

export function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function initials(nombre){
  return String(nombre || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export function downloadBlob(filename, content, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // el navegador ya tomo la referencia, podemos liberarla
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nowHora(){
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
