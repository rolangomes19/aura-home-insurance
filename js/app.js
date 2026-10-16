import { COPY, ROUTES, AR_SCREENS, ANSWER_FIELDS } from './data.js';

const KEY = 'aura-home-v1';
const $ = (s) => document.querySelector(s);

// ---- state: one AnswerSet, persisted so Back and S14 resume work ----
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
export const state = Object.assign({ answers: {}, lang: 'en' }, load());
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ } };
export const setAnswers = (patch) => { Object.assign(state.answers, patch); save(); renderAnswers(); };
export const resetAnswers = () => { state.answers = {}; save(); renderAnswers(); };

// ---- helpers ----
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const t = (path, lang = state.lang) => {
  const get = (l) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), COPY[l]);
  return get(lang) ?? get('en');
};
const aed = (n) => 'AED ' + Number(n).toLocaleString('en-US'); // Western digits [P]
// Every price goes through here so the label can never be missing (3G, X11)
export const price = (n) =>
  `<span class="price"><b>${aed(n)}</b> ${t('perYear')}. <span class="price-label">${t('priceLabel')}</span></span>`;
// Term tip: dotted underline, one sentence, one example (D8)
export const tip = (term, text) =>
  `<button type="button" class="tip" aria-expanded="false" data-tip>${esc(term)}</button><span class="tip-text t-meta" role="note" hidden>${esc(text)}</span>`;

// ---- screens: later phases register renderers here ----
export const screens = {};
const placeholder = (id) => (el) => {
  el.innerHTML = `<h1 class="t-title">${id.toUpperCase()}</h1><p class="t-body">${t('placeholderScreen')}</p>`;
};

const fmt = (key, v) => {
  if (Array.isArray(v)) return v.map((x) => t('values.' + x) ?? x).join(', ');
  if (v === true) return t('yes');
  if (v === false) return t('no');
  return t('values.' + v) ?? v;
};

function renderAnswers() {
  const rows = Object.keys(ANSWER_FIELDS).filter((k) => state.answers[k] != null && state.answers[k] !== '');
  $('#answers').innerHTML = `<summary class="t-body">${t('answersTitle')}</summary>` +
    (rows.length
      ? `<dl class="t-body">${rows.map((k) => `<dt>${t('labels.' + k)}</dt><dd><span>${esc(fmt(k, state.answers[k]))}</span>` +
        `<a href="#/${ANSWER_FIELDS[k]}" data-edit="${k}">${t('edit')}</a></dd>`).join('')}</dl>`
      : `<p class="t-meta">${t('answersEmpty')}</p>`);
}

function renderChrome(id) {
  const step = ROUTES[id];
  $('#tag').textContent = t('tag');
  $('#progress').innerHTML = COPY.en.steps.map((_, i) =>
    `<span class="${i < step ? 'done' : i === step ? 'now' : ''}"${i === step ? ' aria-current="step"' : ''}>${t('steps')[i]}</span>`).join('');
  $('#footer').innerHTML = (t('footer').length > 1 ? t('footer') : COPY.en.footer).map((l) => `<p class="t-meta">${l}</p>`).join('');
  const arOk = AR_SCREENS.includes(id);
  if (!arOk && state.lang === 'ar') setLang('en');
  document.querySelectorAll('[data-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
    if (b.dataset.lang === 'ar') b.disabled = !arOk;
  });
  const note = $('#lang-note');
  note.hidden = arOk;
  note.textContent = t('langNote');
}

function setLang(lang) {
  state.lang = lang; save();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function route() {
  let id = location.hash.replace('#/', '');
  if (!(id in ROUTES)) id = 's01';
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  renderChrome(id);
  renderAnswers();
  (screens[id] || placeholder(id))($('#view'));
  document.title = `${id.toUpperCase()} | Aura prototype`;
  $('#view').focus();
  window.scrollTo(0, 0);
}

// ---- events ----
document.addEventListener('click', (e) => {
  const lang = e.target.closest('[data-lang]');
  if (lang && !lang.disabled) { setLang(lang.dataset.lang); route(); return; }
  const tp = e.target.closest('[data-tip]');
  if (tp) {
    const open = tp.getAttribute('aria-expanded') === 'true';
    tp.setAttribute('aria-expanded', String(!open));
    tp.nextElementSibling.hidden = open;
  }
  const back = e.target.closest('[data-back]');
  if (back) history.back();
});

// Answers panel: always open at desktop width, collapsible below
const desktop = matchMedia('(min-width:1280px)');
const syncPanel = () => { if (desktop.matches) $('#answers').open = true; };
desktop.addEventListener('change', syncPanel);
window.addEventListener('hashchange', () => { route(); syncPanel(); });
route(); syncPanel();
