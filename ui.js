if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.querySelector('.chart-card svg')?.pauseAnimations();
const dialog = document.querySelector('#turtle-dialog');
document.querySelector('#meet-turtle').addEventListener('click', () => {
  document.documentElement.classList.add('modal-open');
  document.querySelector('.site-cursor').classList.remove('visible');
  dialog.showModal();
});
dialog.addEventListener('close', () => document.documentElement.classList.remove('modal-open'));
dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});

const menu = document.querySelector('#reef-menu');
const items = [...menu.querySelectorAll('[role="menuitem"]')];
let priorFocus;
function closeMenu(restore = false) {
  if (menu.hidden) return;
  menu.hidden = true;
  if (restore && priorFocus instanceof HTMLElement) priorFocus.focus();
}
function openMenu(x, y) {
  priorFocus = document.activeElement;
  menu.hidden = false;
  menu.style.left = Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8)) + 'px';
  menu.style.top = Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8)) + 'px';
  items[0].focus();
}
const nativeMenu = target => target.closest('a,button,input,textarea,select,summary,[contenteditable="true"]');
document.addEventListener('contextmenu', event => {
  if (dialog.open || nativeMenu(event.target) || String(getSelection()).trim()) return;
  event.preventDefault();
  openMenu(event.clientX, event.clientY);
});
document.addEventListener('pointerdown', event => {
  if (!menu.contains(event.target)) closeMenu();
});
window.addEventListener('scroll', () => closeMenu(), true);
menu.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', event => {
  if ((event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) && !dialog.open && !nativeMenu(document.activeElement)) {
    event.preventDefault();
    const rect = document.activeElement.getBoundingClientRect();
    openMenu(rect.left + 12, rect.bottom + 8);
  } else if (!menu.hidden) {
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = items.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : -1);
      items[(next + items.length) % items.length].focus();
    }
  }
});

if (matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  const cursor = document.querySelector('.site-cursor');
  document.documentElement.classList.add('cursor-ready');
  document.addEventListener('pointermove', event => {
    cursor.style.transform = 'translate3d(' + event.clientX + 'px,' + event.clientY + 'px,0)';
    cursor.classList.toggle('visible', !dialog.open && !event.target.closest('input,textarea,select,#meet-turtle,[contenteditable="true"]'));
    cursor.classList.toggle('is-hover', !!event.target.closest('a,button,summary'));
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
}