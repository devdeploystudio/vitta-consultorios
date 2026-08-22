// cursor de marca: el punto sigue al mouse directo, el anillo lo persigue con inercia.
// se desactiva solo en touch/sin hover, ahi el navegador ya deja el cursor normal.

export function initCursor(){
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if(!dot || !ring || matchMedia('(pointer:coarse)').matches) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
    const onDark = !!e.target.closest('.login__aside, .sidebar, .manual-hero, .pub-hero, .pub-cta, .pub-footer');
    dot.classList.toggle('is-on-dark', onDark);
    ring.classList.toggle('is-on-dark', onDark);
  });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    requestAnimationFrame(loop);
  };
  loop();

  document.addEventListener('mouseover', (e) => {
    if(e.target.closest('a, button, input, select, textarea, .tab, .agenda-item, .card, .service-card, .sede-card, .why-card')) ring.classList.add('is-active');
  });
  document.addEventListener('mouseout', (e) => {
    if(e.target.closest('a, button, input, select, textarea, .tab, .agenda-item, .card, .service-card, .sede-card, .why-card')) ring.classList.remove('is-active');
  });
}
