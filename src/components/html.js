// Kookia — Gabarits HTML échappés.

// Kookia — outils d'interface : gabarits HTML échappés, icônes,
// fiches modales, messages éphémères, sélection de photo.

export class Html {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export const raw = (value) => new Html(value);

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function fmt(value) {
  if (value instanceof Html) return value.value;
  if (Array.isArray(value)) return value.map(fmt).join('');
  if (value === null || value === undefined || value === false) return '';
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function html(strings, ...values) {
  let out = '';
  strings.forEach((part, i) => {
    out += part;
    if (i < values.length) out += fmt(values[i]);
  });
  return raw(out);
}

export function setHTML(selector, value, root = document) {
  const element = root.querySelector(selector);
  if (element) element.innerHTML = fmt(value);
}
