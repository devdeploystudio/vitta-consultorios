// JS compartido por las páginas públicas del sitio (home, sedes, horarios, contacto).
// Cada página solo tiene los elementos que usa, por eso todo acá revisa que exista antes de engancharse.

import { validateForm } from './validation.js';

export function initPublicNav() {
  const nav = document.getElementById('pubNav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = document.getElementById('pubBurger');
  const links = document.getElementById('pubNavLinks');
  if (!burger || !links) return;
  const close = () => { links.classList.remove('is-open'); burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
}

export function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  targets.forEach((el) => io.observe(el));
}

export function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const note = document.getElementById('contactNote');
  const btn = form.querySelector('button[type="submit"]');
  const originalLabel = btn ? btn.textContent : '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm(form, 'Completá los campos obligatorios antes de enviar.')) return;
    if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }
    if (note) note.textContent = '';
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
      if (note) note.textContent = 'Gracias, recibimos tu mensaje. Te respondemos dentro de las 24 horas hábiles.';
      form.reset();
    }, 900);
  });
}
