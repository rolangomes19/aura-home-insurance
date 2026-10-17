// Page renderers for P1, P2 and Help. Copy comes from data.js / copy-flow.js (no strings here except layout).
import { screens, state, setAnswers, t, esc, tip, bandLabel, aed, query } from './app.js';
import './copy-flow.js';
import { COVER_OPTIONS, PROPERTY_TYPES, EMIRATES, CONTENTS_BANDS, BELONGINGS_BANDS } from './domain.js';
import { eligibility, listingNotes, validMobile, rangeFor } from './engine.js';

export const A = () => state.answers;
export const go = (id) => { location.hash = '#/' + id; };
export const bool = (v) => (v === 'true' ? true : v === 'false' ? false : undefined);
const num = (v) => { const n = Number(String(v ?? '').replace(/[,\s]/g, '')); return v && Number.isFinite(n) && n > 0 ? n : undefined; };
export const vals = (form) => Object.fromEntries(new FormData(form));
const RANK = { p1: 1, p2: 2 };
const band = (v) => (v === '' || v == null ? null : Number(v));
let flash = false; // "Answers saved" shows once on the next screen
export const markSaved = () => { flash = true; };

// ---- form building blocks ----
export const radios = (name, legend, opts, cur, help = '') =>
  `<fieldset class="field" data-field="${name}"><legend class="t-h2">${legend}</legend>${help}` +
  `<div class="stack">${opts.map(([v, label, sub]) =>
    `<label class="opt"><input type="radio" name="${name}" value="${esc(v)}"${String(cur) === String(v) ? ' checked' : ''}>` +
    `<span><b>${label}</b>${sub ? `<span class="t-meta">${sub}</span>` : ''}</span></label>`).join('')}</div>` +
  `<p class="err t-body" id="err-${name}" hidden></p></fieldset>`;
export const yesno = (name, legend, cur, why = '') =>
  radios(name, legend, [['true', t('yes')], ['false', t('no')]], cur === true ? 'true' : cur === false ? 'false' : '',
    why ? `<p class="t-meta">${why}</p>` : '');
export const textField = (name, label, cur, hint, extra = '') =>
  `<div class="field"><label class="t-h2" for="${name}">${label}</label>${extra}` +
  `<input id="${name}" name="${name}" inputmode="numeric" autocomplete="off" value="${cur ?? ''}" aria-describedby="hint-${name} err-${name}">` +
  `<p class="t-meta" id="hint-${name}">${hint}</p><p class="err t-body" id="err-${name}" hidden></p></div>`;
const seeWhy = (msg) => `${msg} <button type="button" class="link" data-seewhy>${t('seeWhy')}</button>`;

export const page = (h1, inner, { back = true, next = t('continue') } = {}) =>
  (flash ? ((flash = false), `<p class="t-meta saved" role="status">${t('saved')}</p>`) : '') +
  `<h1 class="t-title">${h1}</h1><form novalidate id="f" class="form">` +
  `<div id="summary" class="err-summary t-body" role="alert" tabindex="-1" hidden></div>${inner}` +
  `<p class="note t-body" id="live" role="status" hidden></p>` +
  `<div class="row between">${back ? `<button type="button" class="btn btn-quiet" data-back>${t('back')}</button>` : '<span></span>'}` +
  `<button class="btn btn-primary" type="submit">${next}</button></div></form>`;

// All errors at once, plain words, focus the first one (D15, D28)
export function showErrors(root, errs) {
  root.querySelectorAll('.err').forEach((e) => { e.hidden = true; e.textContent = ''; });
  const sum = root.querySelector('#summary');
  sum.hidden = !errs.length;
  if (!errs.length) return true;
  errs.forEach((e) => { const p = root.querySelector('#err-' + e.name); if (p) { p.textContent = e.msg; p.hidden = false; } });
  sum.innerHTML = `<b>${t('fixTitle')}</b><ul>${errs.map((e) => `<li><a href="#" data-focus="${e.name}">${esc(e.label)}: ${esc(e.msg)}</a></li>`).join('')}</ul>`;
  root.querySelector(`[name="${errs[0].name}"]`)?.focus();
  return false;
}

// One wiring for every question screen: live note, conditional fields, validate, save, route.
function wire(el, id, next, { read, validate, live, after, afterSave }) {
  const form = el.querySelector('#f');
  if (query().get('from') === 'p5') next = 'p5'; // Edit from P5 returns there
  const draft = () => ({ ...A(), ...read(form) });
  const refresh = () => {
    const d = draft();
    form.querySelectorAll('[data-show]').forEach((n) => { const [k, v] = n.dataset.show.split('='); n.hidden = String(d[k]) !== v; });
    form.querySelectorAll('[data-has]').forEach((n) => { const [k, v] = n.dataset.has.split(':'); n.hidden = !(d[k] || []).includes(v); });
    const note = live?.(d); const box = form.querySelector('#live');
    box.hidden = !note; box.innerHTML = note || '';
    after?.(form, d);
  };
  const route = (fallback) => {
    const e = eligibility(A());
    go(e.status !== 'ok' && RANK[e.screen] <= RANK[id] ? e.route : fallback);
  };
  const commit = () => { setAnswers(read(form)); afterSave?.(A()); flash = true; };
  form.oninput = form.onchange = refresh;
  form.onclick = (e) => {
    const f = e.target.closest('[data-focus]');
    if (f) { e.preventDefault(); form.querySelector(`[name="${f.dataset.focus}"]`)?.focus(); }
    if (e.target.closest('[data-seewhy]')) { commit(); const r = eligibility(A()); go(r.status === 'ok' ? next : r.route); }
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    if (!showErrors(form, validate(draft()))) return;
    commit(); route(next);
  };
  refresh();
}
export const err = (name, label, msg = t('choose')) => ({ name, label, msg });

// ---- P1 Your home: eligibility first, emirate last (5.2) ----
const ROLE_IDS = ['owner_living_in', 'owner_renting_out', 'tenant'];
screens.p1 = (el) => {
  const s = (k) => t('p1.' + k), a = A();
  const cards = t('p1.cards');
  el.innerHTML = page(s('h1'), `<p class="t-body">${s('sub')}</p>
    <div class="box"><p class="t-label">${s('boxTitle')}</p><p class="t-body">${s('boxBody')}</p><p class="t-meta">${s('range')}</p></div>
    ${radios('role', s('question'), ROLE_IDS.map((r, i) => [r, cards[i][0], cards[i][1]]), a.role)}
    <div data-show="role=tenant">${yesno('tenancy12m', s('tenantQ'), a.tenancy12m)}</div>
    ${radios('propertyType', s('type'), PROPERTY_TYPES.map((p) => [p, t('values.' + p)]), a.propertyType)}
    ${yesno('age18Plus', s('age'), a.age18Plus, s('ageWhy'))}
    ${yesno('emptyOver60', s('empty'), a.emptyOver60, s('emptyWhy'))}
    <div class="field"><label class="t-h2" for="emirate">${s('emirate')}</label>
      <select id="emirate" name="emirate" aria-describedby="err-emirate"><option value="">${s('emirateChoose')}</option>
      ${EMIRATES.map((x) => `<option value="${x}"${a.emirate === x ? ' selected' : ''}>${t('values.' + x)}</option>`).join('')}</select>
      <p class="err t-body" id="err-emirate" hidden></p></div>`, { back: false });
  wire(el, 'p1', 'p2', {
    read: (f) => {
      const d = vals(f);
      return { role: d.role, tenancy12m: d.role === 'tenant' ? bool(d.tenancy12m) : null, propertyType: d.propertyType,
        age18Plus: bool(d.age18Plus), emptyOver60: bool(d.emptyOver60), emirate: d.emirate || undefined };
    },
    validate: (d) => [
      ...(d.role ? [] : [err('role', s('errRole'))]),
      ...(d.role === 'tenant' && typeof d.tenancy12m !== 'boolean' ? [err('tenancy12m', s('errTenancy'))] : []),
      ...(d.propertyType ? [] : [err('propertyType', s('errType'))]),
      ...(typeof d.age18Plus === 'boolean' ? [] : [err('age18Plus', s('errAge'))]),
      ...(typeof d.emptyOver60 === 'boolean' ? [] : [err('emptyOver60', s('errEmpty'))]),
      ...(d.emirate ? [] : [err('emirate', s('errEmirate'))]),
    ],
    live: (d) => {
      const e = eligibility(d);
      if (e.status === 'ok' || e.screen !== 'p1') return '';
      return seeWhy(s(e.variant === 'tenancy' ? 'noteTenancy' : e.status === 'ineligible' ? 'noteNo' : 'noteOther'));
    },
    afterSave: (a2) => { // a changed role can invalidate earlier cover answers
      if (a2.covers && !COVER_OPTIONS[a2.role].some((o) => o.join('+') === a2.covers.join('+'))) setAnswers({ covers: null, rebuildValue: null, contentsBand: null, belongingsBand: null, highestItem: null });
    },
  });
};

// ---- P2 Your cover: cover, values, claims, live range (5.3) ----
const bandSelect = (name, label, bands, cur) => `<div class="field"><label class="t-h2" for="${name}">${label}</label>
  <select id="${name}" name="${name}" aria-describedby="err-${name}"><option value="">${t('p2.bandChoose')}</option>
  ${bands.map((_, i) => `<option value="${i}"${cur === i ? ' selected' : ''}>${bandLabel(bands, i)}</option>`).join('')}</select>
  <p class="err t-body" id="err-${name}" hidden></p></div>`;
screens.p2 = (el) => {
  const a = A();
  if (!a.role) return go('p1');
  const s = (k) => t('p2.' + k), term = (k) => `<p class="t-meta">${tip(...t('p2.terms.' + k))}</p>`;
  const rent = a.role === 'owner_renting_out';
  const opts = COVER_OPTIONS[a.role].map((o) => [o.join('+'), o.map((c) => t('values.' + c)).join(', ')]);
  el.innerHTML = page(s('h1'), `
    ${rent ? `<div class="box"><p class="t-h2">${s('fixed')}</p><p class="t-body">${s('hiddenOwnerRent')}</p></div>`
    : radios('covers', s('coverQ'), opts, (a.covers || []).join('+'), a.role === 'tenant' ? `<p class="t-meta">${s('hiddenTenant')}</p>` : '')}
    <div class="stack">${['building', 'contents', 'personal_belongings'].map((c) => `<p class="note t-body" data-has="covers:${c}">${esc(s('teach.' + c))}</p>`).join('')}</div>
    <p class="note t-body" id="dubai" hidden>${s('dubai')}</p>
    <div data-has="covers:building">${textField('rebuildValue', s('rebuild'), a.rebuildValue, s('format'), term('rebuild'))}</div>
    <div data-has="covers:contents" class="stack">${bandSelect('contentsBand', s('contents'), CONTENTS_BANDS, a.contentsBand)}${term('contents')}</div>
    <div data-has="covers:personal_belongings">${bandSelect('belongingsBand', s('belongings'), BELONGINGS_BANDS, a.belongingsBand)}</div>
    <div id="itembox">${textField('highestItem', s('item'), a.highestItem, s('format'), term('limit'))}</div>
    ${yesno('claims5y', s('claims'), a.claims5y, s('claimsWhy'))}
    <div class="box accent" id="range" aria-live="polite" hidden></div>`,
  { next: t('seePlans') });
  wire(el, 'p2', 'p3', {
    read: (f) => {
      const d = vals(f);
      const covers = rent ? ['building'] : d.covers ? d.covers.split('+') : undefined;
      const has = (c) => !!covers?.includes(c);
      return {
        covers, claims5y: bool(d.claims5y),
        rebuildValue: has('building') ? num(d.rebuildValue) : null,
        contentsBand: has('contents') ? band(d.contentsBand) : null,
        belongingsBand: has('personal_belongings') ? band(d.belongingsBand) : null,
        highestItem: has('contents') || has('personal_belongings') ? num(d.highestItem) : null,
      };
    },
    validate: (d) => {
      const has = (c) => !!d.covers?.includes(c);
      return [
        ...(d.covers ? [] : [err('covers', s('errCover'))]),
        ...(has('building') && !d.rebuildValue ? [err('rebuildValue', s('errRebuild'), t('number'))] : []),
        ...(has('contents') && d.contentsBand == null ? [err('contentsBand', s('errContents'))] : []),
        ...(has('personal_belongings') && d.belongingsBand == null ? [err('belongingsBand', s('errBelongings'))] : []),
        ...((has('contents') || has('personal_belongings')) && !d.highestItem ? [err('highestItem', s('errItem'), t('number'))] : []),
        ...(typeof d.claims5y === 'boolean' ? [] : [err('claims5y', s('errClaims'))]),
      ];
    },
    live: (d) => {
      const e = eligibility(d);
      if (e.status !== 'ok' && e.screen === 'p2') return seeWhy(s(e.variant === 'claims' ? 'noteClaims' : 'noteHigh'));
      return listingNotes(d).map((n) => `<span>${n === 'contents' ? s('noteContents') : s('noteBelongings')}</span>`).join('<br>');
    },
    after: (form, d) => {
      form.querySelector('#itembox').hidden = !(d.covers?.includes('contents') || d.covers?.includes('personal_belongings'));
      form.querySelector('#dubai').hidden = !(d.role?.startsWith('owner') && d.propertyType === 'apartment' && d.emirate === 'dubai' && d.covers?.includes('building'));
      // Live "From AED x to y" once the values are set and nothing sends the user to a person
      const r = eligibility(d).status === 'ok' ? rangeFor(d) : null;
      const box = form.querySelector('#range');
      box.hidden = !r;
      if (r) box.innerHTML = `<p class="t-label">${s('rangeTitle')}</p><p class="t-body"><b>${s('range').replace('{min}', aed(r.min)).replace('{max}', aed(r.max))}</b> <span class="price-label">${t('priceLabel')}</span></p>`;
    },
  });
};

// ---- Help call sheet ----
const quoteId = () => {
  if (!A().quoteId) setAnswers({ quoteId: 'AU-H-' + String(Math.floor(Math.random() * 9e7) + 1e7) }); // format [Invented]
  return A().quoteId;
};

function callSheet(el) {
  const c = (k) => t('call.' + k);
  el.insertAdjacentHTML('beforeend', `<p class="note t-body" id="sent" role="status"${A().callRequested ? '' : ' hidden'}>${A().callRequested ? esc(c('sent')).replace('{id}', esc(A().quoteId)) : ''}</p>
    <dialog id="call" aria-labelledby="call-title"><form novalidate id="cf" class="form">
      <h2 class="t-h2" id="call-title">${c('title')}</h2><p class="t-meta">${c('fake')}</p>
      <div id="csum" class="err-summary t-body" role="alert" hidden></div>
      <div class="field"><label class="t-body" for="cname">${c('name')}</label><input id="cname" name="cname" autocomplete="off"><p class="err t-body" id="err-cname" hidden></p></div>
      <div class="field"><label class="t-body" for="cmobile">${c('mobile')}</label><input id="cmobile" name="cmobile" inputmode="tel" autocomplete="off"><p class="t-meta">${c('mobileHint')}</p><p class="err t-body" id="err-cmobile" hidden></p></div>
      <div class="field"><label class="opt"><input type="checkbox" name="cconsent"><span>${c('consent')}</span></label><p class="err t-body" id="err-cconsent" hidden></p></div>
      <div class="row between"><button type="button" class="btn btn-quiet" data-close>${c('cancel')}</button><button class="btn btn-primary" type="submit">${c('send')}</button></div>
    </form></dialog>`);
  const dlg = el.querySelector('#call'), f = el.querySelector('#cf');
  el.querySelector('[data-call]').onclick = () => dlg.showModal();
  f.querySelector('[data-close]').onclick = () => dlg.close();
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = vals(f);
    const errs = [
      ...(d.cname?.trim() ? [] : [err('cname', c('errName'), t('required'))]),
      ...(validMobile(d.cmobile ?? '') ? [] : [err('cmobile', c('errMobile'), t('mobileBad'))]),
      ...(d.cconsent ? [] : [err('cconsent', c('errConsent'), c('errConsentMsg'))]),
    ];
    const sum = f.querySelector('#csum');
    f.querySelectorAll('.err').forEach((x) => { x.hidden = true; });
    sum.hidden = !errs.length;
    if (errs.length) {
      errs.forEach((x) => { const p = f.querySelector('#err-' + x.name); p.textContent = x.msg; p.hidden = false; });
      sum.innerHTML = `<b>${t('fixTitle')}</b><ul>${errs.map((x) => `<li>${esc(x.label)}: ${esc(x.msg)}</li>`).join('')}</ul>`;
      f.querySelector(`[name="${errs[0].name}"]`).focus();
      return;
    }
    setAnswers({ callRequested: true, contact: { name: d.cname.trim(), mobile: d.cmobile } });
    dlg.close();
    const sent = el.querySelector('#sent');
    sent.hidden = false; sent.textContent = c('sent').replace('{id}', quoteId());
    sent.focus?.();
  };
}

// ---- Help: one template, not eligible or referred (5.10) ----
screens.help = (el) => {
  const e = eligibility(A()), h = (k) => t('help.' + k), id = quoteId();
  const [why, alt] = e.status === 'ok' ? [h('none'), ''] : t('help.variants.' + e.variant);
  const answer = e.variant === 'home_type' ? t('values.' + A().propertyType) : '';
  el.innerHTML = `<h1 class="t-title">${h(e.status === 'referred' ? 'h1Ref' : 'h1No')}</h1>
    <div class="box"><p class="t-label">${h('why')}</p><p class="t-body">${esc(why).replace('{answer}', esc(answer))}</p>
    <p class="t-body"><b>${esc(h('id')).replace('{id}', esc(id))}</b></p></div>
    ${alt ? `<div class="box"><p class="t-label">${h('can')}</p><p class="t-body">${esc(alt)}</p></div>` : ''}
    <div class="row"><a class="btn" href="#/${e.screen || 'p1'}">${t('changeAnswer')}</a>
    <button type="button" class="btn btn-primary" data-call>${t('requestCall')}</button></div>
    <p class="t-body">${h('contact')}</p><p class="t-meta">${t('keepNote')}</p>`;
  callSheet(el);
};
