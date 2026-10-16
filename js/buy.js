// S07 to S14: the buy path (all fake data). 18 form elements on the UAE PASS path, 20 on the manual path (4.4).
import { screens, state, setAnswers, t, esc, price } from './app.js';
import './copy-buy.js';
import { PLANS, ROLES, BELONGINGS_BANDS } from './domain.js';
import { total } from './engine.js';
import { validMobile } from './engine.js';
import { A, go, vals, page, showErrors, err, markSaved } from './screens.js';

const FAKE_CODE = '123456';
const today = () => new Date().toISOString().slice(0, 10);
const plan = () => PLANS[A().planId];
const needPlan = () => !!A().planId || (go('s05'), false);
const aed = (n) => 'AED ' + n.toLocaleString('en-US');
const addons = () => (A().domesticStaff ? ['domestic_staff'] : []);

// Submit with validation; `ok(form, values)` runs only when every check passes.
function submit(el, validate, ok) {
  const f = el.querySelector('#f');
  f.onclick = (e) => {
    const l = e.target.closest('[data-focus]');
    if (l) { e.preventDefault(); f.querySelector(`[name="${l.dataset.focus}"]`)?.focus(); }
  };
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = vals(f);
    if (showErrors(f, validate(d, f))) ok(d, f);
  };
  return f;
}
const input = (name, label, cur = '', hint = '', type = 'text', attrs = '') =>
  `<div class="field"><label class="t-h2" for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(cur)}" autocomplete="off" ${attrs} aria-describedby="hint-${name} err-${name}">` +
  `${hint ? `<p class="t-meta" id="hint-${name}">${hint}</p>` : ''}<p class="err t-body" id="err-${name}" hidden></p></div>`;
const tick = (name, text, on = false) =>
  `<div class="field"><label class="opt"><input type="checkbox" name="${name}"${on ? ' checked' : ''}><span>${text}</span></label><p class="err t-body" id="err-${name}" hidden></p></div>`;
const summary = (p) => `<div class="box"><p class="t-label">${t('s08.plan')}</p><p class="t-body"><b>${p.name}</b></p></div>`;

// ---- S07 save your quote ----
screens.s07 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('s07.' + k), a = A();
  let sent = false;
  el.innerHTML = page(s('h1'), `<p class="t-body">${s('sub')}</p>
    ${input('contact', s('contact'), a.contactId, s('hint'), 'text', 'inputmode="email"')}
    <div class="field" id="codebox" hidden><label class="t-h2" for="code">${s('code')}</label><input id="code" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" aria-describedby="err-code">
      <p class="t-meta">${s('codeSent')}</p><p class="err t-body" id="err-code" hidden></p></div>
    ${tick('marketing', s('marketing'), false)}
    <button type="button" class="btn btn-outline" id="send">${s('send')}</button>`, { next: s('save') });
  const okContact = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || validMobile(v);
  const sendCode = (f) => {
    const v = f.contact.value.trim();
    if (!showErrors(f, okContact(v) ? [] : [err('contact', s('errContact'), s('errContactMsg'))])) return false;
    sent = true; f.querySelector('#codebox').hidden = false; f.code.focus(); return true;
  };
  const f = submit(el, (d) => {
    if (!okContact(d.contact.trim())) return [err('contact', s('errContact'), s('errContactMsg'))];
    if (!sent) return [err('contact', s('errSend'), s('errSendMsg'))];
    return d.code === FAKE_CODE ? [] : [err('code', s('errCode'), s('errCodeMsg'))];
  }, (d) => { setAnswers({ contactId: d.contact.trim(), marketing: !!d.marketing, savedAt: Date.now() }); markSaved(); go('s08'); });
  el.querySelector('#send').onclick = () => sendCode(f);
};

// ---- S08 review ----
screens.s08 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('s08.' + k), a = A(), p = plan();
  const sums = [a.rebuildValue && `${s('rebuild')}: ${aed(a.rebuildValue)}`, a.contentsValue && `${s('contents')}: ${aed(a.contentsValue)}`,
    a.belongingsBand != null && `${s('band')}: ${BELONGINGS_BANDS[a.belongingsBand][1] ? `AED ${BELONGINGS_BANDS[a.belongingsBand].map((n) => n?.toLocaleString('en-US')).join(' to ')}` : `AED ${BELONGINGS_BANDS[a.belongingsBand][0].toLocaleString('en-US')} and above`}`].filter(Boolean);
  const staff = p.addons.includes('domestic_staff');
  el.innerHTML = page(s('h1'), `${summary(p)}
    <div class="box"><p class="t-label">${s('covers')}</p><p class="t-body">${a.covers.map((c) => t('values.' + c)).join(', ')}</p>
      <p class="t-label">${s('sums')}</p>${sums.map((x) => `<p class="t-body">${esc(x)}</p>`).join('')}</div>
    ${input('start', s('start'), a.startDate, s('startHint'), 'date', `min="${today()}"`)}
    ${staff ? `<div class="field"><label class="opt"><input type="checkbox" name="staff"${a.domesticStaff ? ' checked' : ''}><span><b>${s('staff')}</b><span class="t-meta">${esc(s('staffText').replace('{x}', '83'))}</span><span class="price-label">${t('priceLabel')}</span></span></label></div>` : ''}
    <div class="box accent"><p class="t-label">${s('total')}</p><p class="t-body" id="total"></p><p class="t-meta">${s('fixedLine')}</p></div>`);
  const f = submit(el, (d) => (d.start && d.start >= today() ? [] : [err('start', s('errStart'), s('errStartMsg'))]),
    (d) => { setAnswers({ startDate: d.start, domesticStaff: !!d.staff }); markSaved(); go('s09'); });
  const paint = () => { setAnswers({ domesticStaff: !!f.staff?.checked }); el.querySelector('#total').innerHTML = price(total(p, a, addons())); };
  f.onchange = paint; paint();
};

// ---- S09 before you buy ----
screens.s09 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('s09.' + k), p = plan(), blocks = s('blocks');
  blocks[2][1] = s('cancel' + p.id);
  el.innerHTML = page(s('h1'), `<div class="box accent"><p class="t-body">${price(total(p, A(), addons()))}</p></div>
    ${blocks.map(([h, b], i) => `<div class="box"><p class="t-h2">${i + 1}. ${h}</p><p class="t-body">${esc(b)}</p>${tick('b' + i, s('understand'))}</div>`).join('')}
    <p class="t-meta">${s('advice')}</p>`);
  submit(el, (d) => blocks.flatMap(([h], i) => (d['b' + i] ? [] : [err('b' + i, h, s('errTick').replace('{x}', h))])),
    () => { markSaved(); go('s10'); });
};

// ---- S10 about us and consent ----
screens.s10 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('s10.' + k), ticks = s('ticks');
  el.innerHTML = page(s('h1'), `<div class="box"><p class="t-h2">${s('who')}</p><p class="t-body">${s('whoText')}</p>
    <p class="t-h2">${s('paid')}</p><p class="t-body">${s('paidText')}</p></div>
    <p class="note t-body">${s('premium').replace('{insurer}', plan().name)}</p><p class="t-meta">${s('form')}</p>
    ${ticks.map((x, i) => tick('t' + i, x)).join('')}`);
  submit(el, (d) => ticks.flatMap((x, i) => (d['t' + i] ? [] : [err('t' + i, x, s('errTick').replace('{x}', x))])),
    () => { markSaved(); go('s11'); });
};

// ---- S11 ID and documents (fake) ----
const fileOk = (file) => !!file && file.size > 0 && file.size <= 5 * 1024 * 1024 && /\.(pdf|jpe?g|png)$/i.test(file.name);
const upload = (name, label) => `<div class="field"><label class="t-h2" for="${name}">${label}</label><input id="${name}" name="${name}" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="err-${name}"><p class="err t-body" id="err-${name}" hidden></p></div>`;
screens.s11 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('s11.' + k), a = A(), manual = a.idMode === 'manual';
  const owner = ROLES[a.role].documents === 'owner';
  el.innerHTML = page(s('h1'), `<p class="t-body">${s('why')} ${s('keep')}</p><p class="note t-body">${s('fake')}</p>
    ${manual ? `${input('idNumber', s('idNumber'), a.idNumber, s('idHint'))}${input('idExpiry', s('idExpiry'), '', '', 'date', `min="${today()}"`)}${upload('idFile', s('idFile'))}
      <button type="button" class="link" data-mode="uaepass">${s('pass')}</button>`
    : `<div class="field"><button type="button" class="btn btn-outline" name="uaepass" data-uaepass>${a.idVerified ? s('verified') : s('uaepass')}</button><p class="err t-body" id="err-uaepass" hidden></p></div>
      <button type="button" class="link" data-mode="manual">${s('manual')}</button>`}
    ${upload('roleDoc', s(owner ? 'docOwner' : 'docTenant'))}`);
  const f = submit(el, (d, form) => [
    ...(manual ? [
      ...(/^784-?\d{4}-?\d{7}-?\d$/.test(d.idNumber.trim()) ? [] : [err('idNumber', s('errId'), s('errIdMsg'))]),
      ...(d.idExpiry > today() ? [] : [err('idExpiry', s('errExp'), s('errExpMsg'))]),
      ...(fileOk(form.idFile.files[0]) ? [] : [err('idFile', s('errFile'), s('errFileMsg'))]),
    ] : a.idVerified ? [] : [err('uaepass', s('errUae'), s('errUaeMsg'))]),
    ...(fileOk(form.roleDoc.files[0]) ? [] : [err('roleDoc', s('errDoc'), s('errFileMsg'))]),
  ], (d) => { if (manual) setAnswers({ idNumber: d.idNumber.trim() }); markSaved(); go('s12'); });
  el.querySelector('[data-uaepass]')?.addEventListener('click', () => { setAnswers({ idMode: 'uaepass', idVerified: true }); screens.s11(el); });
  el.querySelector('[data-mode]')?.addEventListener('click', (e) => { setAnswers({ idMode: e.target.dataset.mode }); screens.s11(el); });
  return f;
};

// ---- S12 pay (fake) ----
const luhnFree = (n) => /^\d{16}$/.test(n);
const futureMMYY = (v) => { const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m || +m[1] < 1 || +m[1] > 12) return false; const d = new Date(2000 + +m[2], +m[1], 1); return d > new Date(); };
screens.s12 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('s12.' + k), p = plan();
  el.innerHTML = page(s('h1').replace('{insurer}', p.name), `<div class="box accent"><p class="t-body">${price(total(p, A(), addons()))}</p></div>
    <p class="t-meta">${s('provider')}</p><p class="note t-body">${s('test')}</p>
    <p class="err-summary t-body" id="declined" role="alert" tabindex="-1" hidden>${s('declined')}</p>
    ${input('number', s('number'), '', '', 'text', 'inputmode="numeric" autocomplete="off"')}${input('expiry', s('expiry'), '', '', 'text', 'inputmode="numeric" placeholder="MM/YY"')}
    ${input('cvv', s('cvv'), '', '', 'text', 'inputmode="numeric" maxlength="3"')}${input('cname', s('name'))}`, { next: s('pay') });
  const f = submit(el, (d) => [
    ...(luhnFree(d.number.replace(/\s/g, '')) ? [] : [err('number', s('errNumber'), s('errNumberMsg'))]),
    ...(futureMMYY(d.expiry.trim()) ? [] : [err('expiry', s('errExpiry'), s('errExpiryMsg'))]),
    ...(/^\d{3}$/.test(d.cvv) ? [] : [err('cvv', s('errCvv'), s('errCvvMsg'))]),
    ...(d.cname.trim() ? [] : [err('cname', s('errName'), s('errNameMsg'))]),
  ], async (d) => {
    el.querySelector('#declined').hidden = true;
    const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = s('processing');
    await new Promise((r) => setTimeout(r, 1500));
    if (location.hash !== '#/s12') return;
    if (d.number.replace(/\s/g, '') === '4000000000000002') {
      btn.disabled = false; btn.textContent = s('pay');
      const dec = el.querySelector('#declined'); dec.hidden = false; dec.focus(); return;
    }
    const start = new Date(A().startDate), end = new Date(start); end.setFullYear(end.getFullYear() + 1); end.setDate(end.getDate() - 1);
    setAnswers({ policyNo: 'AURA-H-' + Math.floor(Math.random() * 9e6 + 1e6), endDate: end.toISOString().slice(0, 10), paid: total(p, A(), addons()) });
    go('s13');
  });
};

// ---- S13 confirmation ----
screens.s13 = (el) => {
  if (!A().policyNo) return go('s12');
  const s = (k) => t('s13.' + k), a = A(), p = plan(), r = (k) => esc(s(k).replace(/\{insurer\}/g, p.name).replace('{contact}', a.contactId || ''));
  el.innerHTML = `<h1 class="t-title">${s('h1')}</h1><div class="box accent">
    <p class="t-body"><b>${s('policy')}:</b> ${a.policyNo}</p><p class="t-body"><b>${s('dates')}:</b> ${a.startDate} to ${a.endDate}</p>
    <p class="t-body"><b>${s('amount')}:</b> ${price(a.paid)}</p><p class="t-body">${r('issued')}</p></div>
    <div class="stack"><p class="t-body">${r('pdf')}</p><p class="t-body">${r('claims')}</p><p class="t-body">${r('cancel')}</p><p class="t-body">${r('renewal')}</p><p class="t-meta">${r('complaints')}</p></div>
    <div class="row"><button type="button" class="btn btn-quiet" data-again>${s('again')}</button></div>`;
  el.querySelector('[data-again]').onclick = () => { state.answers = {}; setAnswers({}); go('s01'); };
};

// ---- S14 resume ----
screens.s14 = (el) => {
  const s = (k) => t('s14.' + k);
  el.innerHTML = page(s('h1'), `<p class="t-body">${s('sub')}</p>${input('contact', s('contact'), '')}
    ${input('code', s('code'), '', s('codeHint'), 'text', 'inputmode="numeric" maxlength="6"')}`, { next: s('go') });
  submit(el, (d) => {
    const a = A();
    if (!a.contactId || d.contact.trim() !== a.contactId || d.code !== FAKE_CODE) return [err('contact', s('errNone'), s('errNoneMsg'))];
    return Date.now() - a.savedAt > 30 * 864e5 ? [err('contact', s('errExpired'), s('errExpiredMsg'))] : [];
  }, () => go(A().planId ? 's08' : A().covers ? 's05' : 's01'));
};
