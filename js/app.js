import { COPY, ROUTES, AR_SCREENS, ANSWER_FIELDS } from './data.js';
import { BELONGINGS_BANDS } from './domain.js';
import { story } from './story.js';
import './copy-story.js';

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
// Western digits [P, confirm with reviewer]; Arabic puts the unit after the number
export const aed = (n) => (state.lang === 'ar' ? `${Number(n).toLocaleString('en-US')} درهم` : 'AED ' + Number(n).toLocaleString('en-US'));
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

export const bandLabel = (i) => {
  const [a, b] = BELONGINGS_BANDS[i], n = (x) => x.toLocaleString('en-US');
  if (state.lang === 'ar') return b ? `${n(a)} إلى ${n(b)} درهم` : `${n(a)} درهم فأكثر`;
  return b ? `AED ${n(a)} to ${n(b)}` : `AED ${n(a)} and above`;
};
const fmt = (key, v) => {
  if (key === 'belongingsBand') return bandLabel(v);
  if (typeof v === 'number') return aed(v);
  if (Array.isArray(v)) return v.map((x) => t('values.' + x) ?? x).join(', ');
  if (v === true) return t('yes');
  if (v === false) return t('no');
  return t('values.' + v) ?? v;
};

// The answers read as a first-person story; each highlighted token opens a pop-up with a Change link.
function renderAnswers() {
  closePop();
  const sentences = story(state.answers, t('story'), fmt);
  const html = sentences.map((s) => s.map((x) => (x.field
    ? `<button type="button" class="tok" data-tok="${x.field}" aria-expanded="false">${esc(x.text)}</button>`
    : esc(x.text))).join('')).join(' ');
  $('#answers').innerHTML = `<summary class="t-body">${t('answersTitle')}</summary>` +
    (html ? `<p class="story t-body">${html}</p>` : `<p class="t-meta">${t('answersEmpty')}</p>`);
}

// One shared pop-up, placed right after its token so Tab reaches the Change link.
// Hover and focus open it; a click or tap pins it; Esc, outside click or scroll close it.
const pop = Object.assign(document.createElement('span'), { id: 'pop', className: 'pop t-body', hidden: true, tabIndex: -1 });
let popTok = null, pinned = false, hideTimer;
function closePop() {
  clearTimeout(hideTimer);
  popTok?.setAttribute('aria-expanded', 'false');
  popTok = null; pinned = false; pop.hidden = true;
}
function openPop(tok, pin) {
  clearTimeout(hideTimer);
  if (popTok !== tok) {
    closePop();
    popTok = tok;
    tok.setAttribute('aria-expanded', 'true');
    const f = tok.dataset.tok;
    pop.innerHTML = `<span>${esc(t('story.pop.' + f))}</span><a href="#/${ANSWER_FIELDS[f]}">${esc(t('story.change'))}</a>`;
    tok.after(pop);
    pop.hidden = false;
    const r = tok.getBoundingClientRect();
    pop.style.top = `${r.bottom + 6}px`;
    pop.style.left = `${Math.max(8, Math.min(r.left, innerWidth - pop.offsetWidth - 8))}px`;
  }
  pinned = pin;
}
const inPop = (el) => el?.closest?.('.tok, #pop');

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
  const tok = e.target.closest('.tok');
  if (tok) { if (popTok === tok && pinned) closePop(); else openPop(tok, true); }
  else if (!inPop(e.target)) closePop();
});
document.addEventListener('mouseover', (e) => { const tok = e.target.closest('.tok'); if (tok) openPop(tok, pinned && popTok === tok); else if (e.target.closest('#pop')) clearTimeout(hideTimer); });
document.addEventListener('mouseout', (e) => { if (inPop(e.target) && !inPop(e.relatedTarget) && !pinned) hideTimer = setTimeout(closePop, 200); });
document.addEventListener('focusin', (e) => { const tok = e.target.closest?.('.tok'); if (tok) openPop(tok, pinned && popTok === tok); });
document.addEventListener('focusout', (e) => { if (popTok && !inPop(e.relatedTarget)) closePop(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popTok) { popTok.focus(); closePop(); } });
window.addEventListener('scroll', closePop, { passive: true });
window.addEventListener('resize', closePop);

// Answers panel: always open at desktop width, collapsible below
const desktop = matchMedia('(min-width:1280px)');
const syncPanel = () => { if (desktop.matches) $('#answers').open = true; };
export function start() {
  desktop.addEventListener('change', syncPanel);
  window.addEventListener('hashchange', () => { route(); syncPanel(); });
  $('#answers').open = true; // below the main content on small screens, so it can start open
  route(); syncPanel();
}
