// validacion de formularios, compartida entre el sitio publico y el portal.
// mismo criterio en todos lados: los campos con data-only="letters"/"digits"
// filtran lo que se puede tipear, y al enviar se marca en rojo lo que falta
// en vez de tirar el globito feo que muestra el navegador por defecto.

let filtrosListos = false;

export function initInputFilters(){
  if(filtrosListos) return;
  filtrosListos = true;

  document.addEventListener('input', (e) => {
    const only = e.target.dataset?.only;
    if(!only) return;
    const before = e.target.value;
    const start = e.target.selectionStart;
    const after = only === 'digits'
      ? before.replace(/\D/g, '')
      : before.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '');
    if(after === before) return;
    e.target.value = after;
    const pos = start - (before.length - after.length);
    e.target.setSelectionRange(pos, pos);
  }, true);

  // apenas corrige un campo marcado, se le saca el rojo y se esconde la alerta
  document.addEventListener('input', (e) => {
    if(!e.target.matches('input[required], select[required], textarea[required]')) return;
    if(e.target.checkValidity()) e.target.classList.remove('is-invalid');
    const form = e.target.closest('form');
    const alertEl = form?.querySelector('.form-alert');
    if(alertEl) alertEl.hidden = true;
  });
}

export function validateForm(form, mensaje){
  const campos = [...form.querySelectorAll('input[required], select[required], textarea[required]')];
  const invalidos = campos.filter((c) => !c.checkValidity());
  campos.forEach((c) => c.classList.toggle('is-invalid', !c.checkValidity()));

  const alertEl = form.querySelector('.form-alert');
  if(alertEl){
    if(mensaje) alertEl.textContent = mensaje;
    alertEl.hidden = invalidos.length === 0;
  }

  if(invalidos.length){
    invalidos[0].focus();
    return false;
  }
  return true;
}
