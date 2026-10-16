// Screen renderers for S01 to S04, E1, E2. Copy comes from data.js / copy-flow.js (no strings here except layout).
import { screens, state, setAnswers, t, esc, tip, bandLabel } from './app.js';
import './copy-flow.js';
import { ROLES, COVER_OPTIONS, PROPERTY_TYPES, EMIRATES, BELONGINGS_BANDS } from './domain.js';
import { eligibility, listingNotes, validMobile } from './engine.js';

const A = () => state.answers;
const go = (id) => { location.hash = '#/' + id; };
const bool = (v) => (v === 'true' ? true : v === 'false' ? false : undefined);
const num = (v) => { const n = Number(String(v ?? '').replace(/[,\s]/g, '')); return v && Number.isFinite(n) && n > 0 ? n : undefined; };
const vals = (form) => Object.fromEntries(new FormData(form));
const RANK = { s01: 1, s02: 2, s03: 3, s04: 4 };
let flash = false; // "Answers saved" shows once on the next screen

// ---- form building blocks ----
const radios = (name, legend, opts, cur, help = '') =>
  `<fieldset class="field" data-field="${name}"><legend class="t-h2">${legend}</legend>${help}` +
  `<div class="stack">${opts.map(([v, label, sub]) =>
    `<label class="opt"><input type="radio" name="${name}" value="${esc(v)}"${String(cur) === String(v) ? ' checked' : ''}>` +
    `<span><b>${label}</b>${sub ? `<span class="t-meta">${sub}</span>` : ''}</span></label>`).join('')}</div>` +
  `<p class="err t-body" id="err-${name}" hidden></p></fieldset>`;
const yesno = (name, legend, cur, why = '') =>
  radios(name, legend, [['true', t('yes')], ['false', t('no')]], cur === true ? 'true' : cur === false ? 'false' : '',
    why ? `<p class="t-meta">${why}</p>` : '');
const textField = (name, label, cur, hint, extra = '') =>
  `<div class="field"><label class="t-h2" for="${name}">${label}</label>${extra}` +
  `<input id="${name}" name="${name}" inputmode="numeric" autocomplete="off" value="${cur ?? ''}" aria-describedby="hint-${name} err-${name}">` +
  `<p class="t-meta" id="hint-${name}">${hint}</p><p class="err t-body" id="err-${name}" hidden></p></div>`;
const seeWhy = (msg) => `${msg} <button type="button" class="link" data-seewhy>${t('seeWhy')}</button>`;

const page = (h1, inner, { back = true, next = t('continue') } = {}) =>
  (flash ? ((flash = false), `<p class="t-meta saved" role="status">${t('saved')}</p>`) : '') +
  `<h1 class="t-title">${h1}</h1><form novalidate id="f" class="form">` +
  `<div id="summary" class="err-summary t-body" role="alert" tabindex="-1" hidden></div>${inner}` +
  `<p class="note t-body" id="live" role="status" hidden></p>` +
  `<div class="row between">${back ? `<button type="button" class="btn btn-quiet" data-back>${t('back')}</button>` : '<span></span>'}` +
  `<button class="btn btn-primary" type="submit">${next}</button></div></form>`;

// All errors at once, plain words, focus the first one (D15, D28)
function showErrors(root, errs) {
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
  const draft = () => ({ ...A(), ...read(form) });
  const refresh = () => {
    const d = draft();
    form.querySelectorAll('[data-show]').forEach((n) => { const [k, v] = n.dataset.show.split('='); n.hidden = String(d[k]) !== v; });
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
const err = (name, label, msg = t('choose')) => ({ name, label, msg });

// ---- S01 ----
const ROLE_IDS = ['owner_living_in', 'owner_renting_out', 'tenant'];
screens.s01 = (el) => {
  const s = (k) => t('s01.' + k), a = A();
  const cards = t('s01.cards');
  el.innerHTML = page(s('h1'), `<p class="t-body">${s('sub')}</p>
    <div class="box"><p class="t-label">${s('boxTitle')}</p><p class="t-body">${s('boxBody')}</p></div>
    ${radios('role', s('question'), ROLE_IDS.map((r, i) => [r, cards[i][0], cards[i][1]]), a.role)}
    <div data-show="role=tenant">${yesno('tenancy12m', s('tenantQ'), a.tenancy12m)}</div>
    <p class="t-meta">${s('range')}</p><p class="t-meta">${s('trust')}</p>`, { back: false });
  wire(el, 's01', 's02', {
    read: (f) => { const d = vals(f); return { role: d.role, tenancy12m: d.role === 'tenant' ? bool(d.tenancy12m) : null }; },
    validate: (d) => [
      ...(d.role ? [] : [err('role', s('errRole'))]),
      ...(d.role === 'tenant' && typeof d.tenancy12m !== 'boolean' ? [err('tenancy12m', s('errTenancy'))] : []),
    ],
    live: (d) => (d.role === 'tenant' && d.tenancy12m === false ? seeWhy(s('noteTenancy')) : ''),
    afterSave: (a2) => { // a changed role can invalidate earlier cover answers
      if (a2.covers && !COVER_OPTIONS[a2.role].some((o) => o.join('+') === a2.covers.join('+'))) setAnswers({ covers: null, rebuildValue: null, contentsValue: null, belongingsBand: null, highestItem: null });
    },
  });
};

// ---- S02 ----
screens.s02 = (el) => {
  const s = (k) => t('s02.' + k), a = A();
  el.innerHTML = page(s('h1'), `
    ${radios('propertyType', s('type'), PROPERTY_TYPES.map((p) => [p, t('values.' + p)]), a.propertyType)}
    <div class="field"><label class="t-h2" for="emirate">${s('emirate')}</label>
      <select id="emirate" name="emirate" aria-describedby="err-emirate"><option value="">${s('emirateChoose')}</option>
      ${EMIRATES.map((x) => `<option value="${x}"${a.emirate === x ? ' selected' : ''}>${t('values.' + x)}</option>`).join('')}</select>
      <p class="err t-body" id="err-emirate" hidden></p></div>
    ${yesno('age18Plus', s('age'), a.age18Plus, s('ageWhy'))}
    ${yesno('emptyOver60', s('empty'), a.emptyOver60, s('emptyWhy'))}`);
  wire(el, 's02', 's03', {
    read: (f) => { const d = vals(f); return { propertyType: d.propertyType, emirate: d.emirate || undefined, age18Plus: bool(d.age18Plus), emptyOver60: bool(d.emptyOver60) }; },
    validate: (d) => [
      ...(d.propertyType ? [] : [err('propertyType', s('type'))]),
      ...(d.emirate ? [] : [err('emirate', s('emirate'))]),
      ...(typeof d.age18Plus === 'boolean' ? [] : [err('age18Plus', s('age'))]),
      ...(typeof d.emptyOver60 === 'boolean' ? [] : [err('emptyOver60', s('empty'))]),
    ],
    live: (d) => {
      const e = eligibility(d);
      if (e.status === 'ok' || e.screen !== 's02') return '';
      return e.route === 'e1' ? seeWhy(s('noteNo')) : seeWhy(s('noteOther'));
    },
  });
};

// ---- S03 ----
screens.s03 = (el) => {
  const a = A();
  if (!a.role) return go('s01');
  const s = (k) => t('s03.' + k);
  const opts = COVER_OPTIONS[a.role].map((o) => [o.join('+'), o.map((c) => t('values.' + c)).join(', ')]);
  const hidden = a.role === 'owner_renting_out' ? s('hiddenOwnerRent') : a.role === 'tenant' ? s('hiddenTenant') : '';
  el.innerHTML = page(s('h1'), `
    ${radios('covers', s('errCover'), opts, (a.covers || []).join('+'))}
    ${hidden ? `<p class="t-meta">${hidden}</p>` : ''}
    <p class="note t-body" id="dubai" hidden>${s('dubai')}</p>
    <div class="stack">${ROLES[a.role].allowedCovers.map((c) => `<div class="box"><p class="t-body"><b>${t('values.' + c)}</b></p><p class="t-body">${esc(t('s03.tips.' + c))}</p></div>`).join('')}</div>
    ${a.role === 'tenant' ? '' : `<p class="t-meta">${s('staff')}</p>`}
    ${yesno('claims5y', s('claims'), a.claims5y, s('claimsWhy'))}`);
  wire(el, 's03', 's04', {
    read: (f) => { const d = vals(f); return { covers: d.covers ? d.covers.split('+') : undefined, claims5y: bool(d.claims5y) }; },
    validate: (d) => [
      ...(d.covers ? [] : [err('covers', s('errCover'))]),
      ...(typeof d.claims5y === 'boolean' ? [] : [err('claims5y', s('errClaims'))]),
    ],
    live: (d) => (d.claims5y === true ? seeWhy(s('noteClaims')) : ''),
    after: (form, d) => {
      form.querySelector('#dubai').hidden = !(d.role?.startsWith('owner') && d.propertyType === 'apartment' && d.emirate === 'dubai' && d.covers?.includes('building'));
    },
    afterSave: (a2) => { // drop values for covers no longer chosen
      const c = a2.covers || [];
      setAnswers({
        rebuildValue: c.includes('building') ? a2.rebuildValue : null,
        contentsValue: c.includes('contents') ? a2.contentsValue : null,
        belongingsBand: c.includes('personal_belongings') ? a2.belongingsBand : null,
        highestItem: c.includes('contents') || c.includes('personal_belongings') ? a2.highestItem : null,
      });
    },
  });
};

// ---- S04 ----
screens.s04 = (el) => {
  const a = A(), c = a.covers;
  if (!c) return go('s03');
  const s = (k) => t('s04.' + k);
  const hasB = c.includes('building'), hasC = c.includes('contents'), hasP = c.includes('personal_belongings');
  const termLine = (term, text) => `<p class="t-meta">${tip(term, text)}</p>`;
  el.innerHTML = page(s('h1'), `
    ${hasB ? textField('rebuildValue', s('rebuild'), a.rebuildValue, s('format'), `<p class="t-meta">${s('rebuildHelp')}</p>${termLine(s('termSum'), s('sumTip'))}`) : ''}
    ${hasC ? textField('contentsValue', s('contents'), a.contentsValue, s('format'), `<p class="t-meta">${s('contentsHelp')}</p>`) : ''}
    ${hasP ? `<div class="field"><label class="t-h2" for="belongingsBand">${s('belongings')}</label><p class="t-meta">${s('belongingsHelp')}</p>
      <select id="belongingsBand" name="belongingsBand" aria-describedby="err-belongingsBand"><option value="">${s('bandChoose')}</option>
      ${BELONGINGS_BANDS.map((_, i) => `<option value="${i}"${a.belongingsBand === i ? ' selected' : ''}>${bandLabel(i)}</option>`).join('')}</select>
      <p class="err t-body" id="err-belongingsBand" hidden></p></div>` : ''}
    ${hasC || hasP ? textField('highestItem', s('item'), a.highestItem, s('format'), `<p class="t-meta">${s('itemHelp')}</p>${termLine(s('termLimit'), s('limitTip'))}`) : ''}`,
  { next: t('seePlans') });
  wire(el, 's04', 's05', {
    read: (f) => { const d = vals(f); return { rebuildValue: num(d.rebuildValue), contentsValue: num(d.contentsValue), belongingsBand: d.belongingsBand ? Number(d.belongingsBand) : undefined, highestItem: num(d.highestItem) }; },
    validate: (d) => [
      ...(hasB && !d.rebuildValue ? [err('rebuildValue', s('rebuild'), t('number'))] : []),
      ...(hasC && !d.contentsValue ? [err('contentsValue', s('contents'), t('number'))] : []),
      ...(hasP && d.belongingsBand == null ? [err('belongingsBand', s('belongings'))] : []),
      ...((hasC || hasP) && !d.highestItem ? [err('highestItem', s('item'), t('number'))] : []),
    ],
    live: (d) => listingNotes(d).map((n) => `<span>${n === 'contents' ? s('noteContents') : s('noteBelongings')}</span>`).join('<br>'),
  });
};

// ---- E1 / E2 and the call sheet ----
const quoteId = () => {
  if (!A().quoteId) setAnswers({ quoteId: 'Q-' + String(Math.floor(Math.random() * 900000) + 100000) });
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

const blockActions = (el, screen) => {
  quoteId();
  el.insertAdjacentHTML('beforeend', `<div class="row"><a class="btn" href="#/${screen}">${t('changeAnswer')}</a>
    <button type="button" class="btn btn-primary" data-call>${t('requestCall')}</button></div>
    <p class="t-body">${t('e1.contact')}</p><p class="t-meta">${t('keepNote')}</p>`);
  callSheet(el);
};

screens.e1 = (el) => {
  const e = eligibility(A());
  if (e.status === 'referred') return go('e2');
  const [why, alt] = e.status === 'ok' ? [t('e1.none'), ''] : t('e1.variants.' + e.variant);
  const answer = e.variant === 'home_type' ? t('values.' + A().propertyType) : '';
  el.innerHTML = `<h1 class="t-title">${t('e1.h1')}</h1>
    <div class="box"><p class="t-label">${t('e1.why')}</p><p class="t-body">${esc(why).replace('{answer}', esc(answer))}</p></div>
    ${alt ? `<div class="box"><p class="t-label">${t('e1.can')}</p><p class="t-body">${esc(alt)}</p></div>` : ''}`;
  blockActions(el, e.screen || 's01');
};

screens.e2 = (el) => {
  const e = eligibility(A());
  if (e.status === 'ineligible') return go('e1');
  const id = quoteId();
  el.innerHTML = `<h1 class="t-title">${t('e2.h1')}</h1>
    <div class="box"><p class="t-body">${esc(e.status === 'ok' ? t('e1.none') : t('e2.variants.' + e.variant))}</p>
    <p class="t-body"><b>${esc(t('e2.id')).replace('{id}', esc(id))}</b></p></div>`;
  blockActions(el, e.screen || 's01');
};
