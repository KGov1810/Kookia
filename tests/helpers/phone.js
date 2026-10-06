// Simule un iPhone : page Kookia chargée dans le navigateur de test, avec des outils
// pour toucher les boutons et remplir les champs.
import fs from 'node:fs';
import path from 'node:path';

export async function createPhone(_name, { standalone = true, storage = {} } = {}) {
  const page = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  document.body.innerHTML = page.slice(page.indexOf('<body>') + 6, page.lastIndexOf('</body>')).replace(/<script[\s\S]*?<\/script>/g, '');
  localStorage.clear();
  for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  Object.defineProperty(navigator, 'standalone', { value: standalone, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__copied = t; } } });
  window.matchMedia = () => ({ matches: false, addEventListener() {} });
  if (!window.CSS?.escape) window.CSS = { escape: (s) => String(s).replace(/"/g, '\\"') };
  window.confirm = () => true;
  window.scrollTo = () => {};
  window.FIREBASE_CONFIG = { apiKey: '' };
  const errors = [];
  window.addEventListener('error', (e) => errors.push(e.error ?? e.message));

  await import('../../src/main.js');

  const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));
  await tick();
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const click = async (el, ms) => {
    if (typeof el === 'string') {
      const found = $(el);
      if (!found) throw new Error(`élément introuvable : ${el}`);
      el = found;
    }
    if (!el) throw new Error('élément introuvable');
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await tick(ms);
  };
  const type = async (selector, value, eventName = 'input') => {
    const el = typeof selector === 'string' ? $(selector) : selector;
    if (!el) throw new Error(`champ introuvable : ${selector}`);
    el.value = value;
    el.dispatchEvent(new window.Event(eventName, { bubbles: true }));
    await tick();
  };
  const text = () => document.body.textContent.replace(/\s+/g, ' ');
  return { w: window, $, $$, click, type, tick, text, errors };
}
