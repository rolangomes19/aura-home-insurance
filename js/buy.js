// P4 to P8: save, review, ID, pay, confirmation (all fake data). Totals come from engine.getTotals only.
import { screens, state, setAnswers, t, esc, price, aed, fmt, query } from './app.js';
import './copy-buy.js';
import { PLANS, ROLES } from './domain.js';
import { getTotals, fits, eligibility, carryAddOns, validMobile, changedField, PRICE_FIELDS } from './engine.js';
import { ANSWER_FIELDS, RESUMABLE } from './data.js';
import { A, go, vals, page, showErrors, err, markSaved } from './screens.js';

const FAKE_CODE = '123456'; // [Invented]
const today = () => new Date().toISOString().slice(0, 10);
const plan = () => PLANS[A().planId];
const totals = () => getTotals(plan(), A(), A().addOns || []);
const ins = () => `<bdi dir="ltr">${plan().insurer}</bdi>`;
const pname = () => esc(t(`plans.${A().planId}.name`));
// Buy pages need a chosen plan that still fits answers that still pass (7.3)
const needPlan = () => {
  const a = A();
  if (!a.covers) return go('p2'), false;
  if (eligibility(a).status !== 'ok') return go('help'), false;
  if (!a.planId || !fits(plan(), a).fits) return go('p3'), false;
  if (!totals()) return go('p2'), false;
  return true;
};

// Submit with validation; `ok(values, form)` runs only when every check passes.
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
const okContact = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || validMobile(v);

// ---- P4 save your quote, and resume by code (5.5) ----
screens.p4 = (el) => {
  const resume = query().has('resume');
  if (resume) {
    const s = (k) => t('p4.' + k), r = (k) => t('p4.resume.' + k);
    el.innerHTML = page(r('h1'), `<p class="t-body">${r('sub')}</p>${input('contact', s('contact'), '', s('hint'), 'text', 'inputmode="email"')}
      ${input('code', s('code'), '', s('demo'), 'text', 'inputmode="numeric" maxlength="6" autocomplete="one-time-code"')}`, { next: r('go') });
    return submit(el, (d) => {
      const a = A();
      if (!a.contactId || d.contact.trim() !== a.contactId || d.code !== FAKE_CODE) return [err('contact', r('errNone'), r('errNoneMsg'))];
      return Date.now() - a.savedAt > 30 * 864e5 ? [err('contact', r('errExpired'), r('errExpiredMsg'))] : []; // 30 days [Invented]
    }, () => go(RESUMABLE.includes(A().lastPage) ? A().lastPage : 'p1'));
  }
  if (!needPlan()) return;
  const s = (k) => t('p4.' + k), a = A();
  let sent = false;
  el.innerHTML = page(s('h1'), `<p class="t-body">${s('sub')}</p>
    ${input('contact', s('contact'), a.contactId, s('hint'), 'text', 'inputmode="email"')}
    <button type="button" class="btn btn-outline" id="send">${s('send')}</button>
    <div class="field" id="codebox" hidden><label class="t-h2" for="code">${s('code')}</label><input id="code" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" aria-describedby="demo err-code">
      <p class="note t-body" id="demo">${s('demo')}</p><p class="err t-body" id="err-code" hidden></p></div>
    ${tick('marketing', s('marketing'), false)}`, { next: s('save') });
  const f = submit(el, (d) => {
    if (!okContact(d.contact.trim())) return [err('contact', s('errContact'), s('errContactMsg'))];
    if (!sent) return [err('contact', s('errSend'), s('errSendMsg'))];
    return d.code === FAKE_CODE ? [] : [err('code', s('errCode'), s('errCodeMsg'))];
  }, (d) => { setAnswers({ contactId: d.contact.trim(), marketing: !!d.marketing, savedAt: Date.now() }); markSaved(); go('p5'); });
  el.querySelector('#send').onclick = () => {
    const v = f.contact.value.trim();
    if (!showErrors(f, okContact(v) ? [] : [err('contact', s('errContact'), s('errContactMsg'))])) return;
    sent = true; f.querySelector('#codebox').hidden = false; f.code.focus();
  };
};

// ---- P5 review and confirm: plan, start date, answers, 4 disclosures, 3 consents (5.6) ----
const TICKS = ['b0', 'b1', 'b2', 'b3', 'who', 'premium', 'auth'];
screens.p5 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('p5.' + k), a = A(), p = plan();
  const notes = [];
  // Add-on no longer allowed: remove with one line (7.3)
  const c = carryAddOns(p, a, a.addOns || []);
  if (c.removed.length) { c.removed.forEach((id) => notes.push(t('p3.removed').replace('{x}', t('values.' + id)).replace('{plan}', t(`plans.${p.id}.name`)))); setAnswers({ addOns: c.sel }); }
  const tot = totals();
  const q = a.quoted;
  if (q && q.base !== tot.base) notes.push(t('p3.baseChanged').replace('{x}', aed(q.base)).replace('{y}', aed(tot.base)).replace('{answer}', t('labels.' + (changedField(q.answers, a) || 'covers')).toLowerCase()));
  // The line shows once; P5 and P7 then confirm this total (7.5)
  if (!q || q.total !== tot.totalNow || q.base !== tot.base) setAnswers({ quoted: { planId: p.id, base: tot.base, total: tot.totalNow, answers: Object.fromEntries(PRICE_FIELDS.map((k) => [k, a[k] ?? null])) } });

  // Ticks clear when plan, add-ons or any answer changes
  const sig = JSON.stringify([a.planId, a.addOns, ...Object.keys(ANSWER_FIELDS).map((k) => a[k] ?? null)]);
  const kept = a.p5?.sig === sig ? a.p5.ticks : [];
  const on = (n) => kept.includes(n);

  const sums = [a.rebuildValue && `${s('rebuild')}: ${fmt('rebuildValue', a.rebuildValue)}`, a.contentsBand != null && `${s('contents')}: ${fmt('contentsBand', a.contentsBand)}`,
    a.belongingsBand != null && `${s('belongings')}: ${fmt('belongingsBand', a.belongingsBand)}`].filter(Boolean);
  const addons = tot.addOns.length ? tot.addOns.map((x) => `${esc(t('values.' + x.id))}${x.qty > 1 ? ` × ${x.qty}` : ''}: ${price(x.amount)}`).join('<br>') : s('none');
  const covers = a.covers.map((x) => t('values.' + x)).join(', ');
  const list = (arr) => `<ul class="t-body">${arr.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>`;
  const terms = [t(`plans.${p.id}.cancel`), t(`plans.${p.id}.cooling`)].filter(Boolean);
  const blocks = [
    `<p class="t-body">${esc(covers)}. ${esc(sums.join('. '))}.</p><p class="t-body">${s('addons')}: ${addons}</p><p class="t-body">${s('limits').replace('{c}', aed(p.limits.singleItemContents)).replace('{b}', aed(p.limits.singleItemBelongings))}</p>`,
    list(t(`plans.${p.id}.notCovered`)),
    `<p class="t-body">${esc(terms.length ? terms.join(' ') : s('noWording'))}</p>`,
    `<p class="t-body">${s('wrong')}</p>`,
  ];
  const answers = Object.keys(ANSWER_FIELDS).filter((k) => a[k] != null && a[k] !== '')
    .map((k) => `<dt class="t-meta">${t('labels.' + k)}</dt><dd class="t-body">${esc(fmt(k, a[k]))} <a href="#/${ANSWER_FIELDS[k]}?from=p5">${t('edit')}<span class="sr-only"> ${t('labels.' + k)}</span></a></dd>`).join('');

  el.innerHTML = page(s('h1'), `
    ${notes.length ? `<div class="change t-body" role="status">${notes.map(esc).join('<br>')}</div>` : ''}
    <div class="box accent"><p class="t-label">${s('plan')}</p><p class="t-h2">${pname()}</p><p class="t-meta">${t('p3.insurer').replace('{x}', ins())}</p>
      <p class="t-body"><b>${s('covers')}:</b> ${esc(covers)}</p><p class="t-body"><b>${s('sums')}:</b> ${esc(sums.join('. '))}</p>
      <p class="t-body"><b>${s('addons')}:</b> ${addons}</p><p class="t-body"><b>${s('total')}:</b> ${price(tot.totalNow)}</p>
      <a href="#/p3">${s('change')}</a></div>
    ${input('start', s('start'), a.startDate, s('startHint'), 'date', `min="${today()}"`)}
    <details class="fold"><summary class="t-h2">${s('answers')}</summary><dl class="rows">${answers}</dl></details>
    <h2 class="t-h2">${s('before')}</h2>
    ${t('p5.blocks').map((h, i) => `<div class="box"><p class="t-h2">${i + 1}. ${h}</p>${blocks[i]}${tick('b' + i, s('understand'), on('b' + i))}</div>`).join('')}
    <p class="t-meta">${s('advice')}</p>
    <div class="box"><p class="t-h2">${s('who')}</p><p class="t-body">${s('whoText')}</p>${tick('who', s('whoTick'), on('who'))}</div>
    <div class="box"><p class="t-body">${s('premium').replace('{insurer}', ins())}</p>${tick('premium', s('premiumTick').replace('{insurer}', ins()), on('premium'))}</div>
    <div class="box"><p class="t-body">${s('auth')}</p>${tick('auth', s('authTick'), on('auth'))}</div>`);
  const label = (n) => (n[0] === 'b' ? t('p5.blocks')[+n[1]] : s(n + 'Tick').replace('{insurer}', plan().insurer));
  const f = submit(el, (d) => [
    ...(d.start && d.start >= today() ? [] : [err('start', s('errStart'), s('errStartMsg'))]),
    ...TICKS.flatMap((n) => (d[n] ? [] : [err(n, label(n), s('errTick').replace('{x}', label(n)))])),
  ], (d) => { setAnswers({ startDate: d.start }); markSaved(); go('p6'); });
  f.onchange = () => setAnswers({ startDate: f.start.value || a.startDate, p5: { sig, ticks: TICKS.filter((n) => f[n].checked) } });
};

// ---- P6 ID and documents (fake, 5.7) ----
const fileOk = (file) => !!file && file.size > 0 && file.size <= 5 * 1024 * 1024 && /\.(pdf|jpe?g|png)$/i.test(file.name);
const upload = (name, label) => `<div class="field"><label class="t-h2" for="${name}">${label}</label><input id="${name}" name="${name}" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="err-${name}"><p class="err t-body" id="err-${name}" hidden></p></div>`;
screens.p6 = (el) => {
  if (!needPlan()) return;
  const s = (k) => t('p6.' + k), a = A(), manual = a.idMode === 'manual';
  const owner = ROLES[a.role].documents === 'owner';
  el.innerHTML = page(s('h1'), `<p class="t-body">${s('why')} ${s('keep')}</p><p class="note t-body">${s('fake')}</p>
    ${manual ? `${input('idNumber', s('idNumber'), a.idNumber, s('idHint'))}${input('idExpiry', s('idExpiry'), '', '', 'date', `min="${today()}"`)}${upload('idFile', s('idFile'))}
      <button type="button" class="link" data-mode="uaepass">${s('pass')}</button>`
    : `<div class="field"><button type="button" class="btn btn-outline" name="uaepass" data-uaepass>${a.idVerified ? s('verified') : s('uaepass')}</button><p class="err t-body" id="err-uaepass" hidden></p></div>
      <button type="button" class="link" data-mode="manual">${s('manual')}</button>`}
    ${upload('roleDoc', s(owner ? 'docOwner' : 'docTenant'))}`);
  submit(el, (d, form) => [
    ...(manual ? [
      ...(/^784-?\d{4}-?\d{7}-?\d$/.test(d.idNumber.trim()) ? [] : [err('idNumber', s('errId'), s('errIdMsg'))]),
      ...(d.idExpiry > today() ? [] : [err('idExpiry', s('errExp'), s('errExpMsg'))]),
      ...(fileOk(form.idFile.files[0]) ? [] : [err('idFile', s('errFile'), s('errFileMsg'))]),
    ] : a.idVerified ? [] : [err('uaepass', s('errUae'), s('errUaeMsg'))]),
    ...(fileOk(form.roleDoc.files[0]) ? [] : [err('roleDoc', s('errDoc'), s('errFileMsg'))]),
  ], (d) => { if (manual) setAnswers({ idNumber: d.idNumber.trim() }); markSaved(); go('p7'); });
  el.querySelector('[data-uaepass]')?.addEventListener('click', () => { setAnswers({ idMode: 'uaepass', idVerified: true }); screens.p6(el); });
  el.querySelector('[data-mode]')?.addEventListener('click', (e) => { setAnswers({ idMode: e.target.dataset.mode }); screens.p6(el); });
};

// ---- P7 pay (fake, 5.8) ----
const futureMMYY = (v) => { const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m || +m[1] < 1 || +m[1] > 12) return false; return new Date(2000 + +m[2], +m[1], 1) > new Date(); };
screens.p7 = (el) => {
  if (!needPlan()) return;
  if (!A().startDate) return go('p5');
  const s = (k) => t('p7.' + k), tot = totals();
  el.innerHTML = page(s('h1').replace('{insurer}', ins()), `<div class="box accent"><p class="t-body">${price(tot.totalNow)}</p></div>
    <p class="t-meta">${s('provider')}</p><p class="note t-body">${s('test')}</p>
    <p class="err-summary t-body" id="declined" role="alert" tabindex="-1" hidden>${s('declined')}</p>
    ${input('number', s('number'), '', '', 'text', 'inputmode="numeric" autocomplete="off"')}${input('expiry', s('expiry'), '', '', 'text', 'inputmode="numeric" placeholder="MM/YY"')}
    ${input('cvv', s('cvv'), '', '', 'text', 'inputmode="numeric" maxlength="3"')}${input('cname', s('name'))}`, { next: s('pay') });
  const f = submit(el, (d) => [
    ...(/^\d{16}$/.test(d.number.replace(/\s/g, '')) ? [] : [err('number', s('errNumber'), s('errNumberMsg'))]),
    ...(futureMMYY(d.expiry.trim()) ? [] : [err('expiry', s('errExpiry'), s('errExpiryMsg'))]),
    ...(/^\d{3}$/.test(d.cvv) ? [] : [err('cvv', s('errCvv'), s('errCvvMsg'))]),
    ...(d.cname.trim() ? [] : [err('cname', s('errName'), s('errNameMsg'))]),
  ], async (d) => {
    el.querySelector('#declined').hidden = true;
    const btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = s('processing');
    await new Promise((r) => setTimeout(r, 1500));
    if (!location.hash.startsWith('#/p7')) return;
    if (d.number.replace(/\s/g, '').endsWith('0002')) { // decline rule [Invented]
      btn.disabled = false; btn.textContent = s('pay');
      const dec = el.querySelector('#declined'); dec.hidden = false; dec.focus(); return;
    }
    const start = new Date(A().startDate), end = new Date(start); end.setFullYear(end.getFullYear() + 1); end.setDate(end.getDate() - 1);
    setAnswers({ policyNo: 'AURA-H-' + Math.floor(Math.random() * 9e6 + 1e6), endDate: end.toISOString().slice(0, 10), paid: tot.totalNow });
    go('p8');
  });
};

// ---- P8 confirmation (5.9) ----
screens.p8 = (el) => {
  const a = A();
  if (!a.policyNo || !a.planId) return go('p7');
  const s = (k) => t('p8.' + k), p = plan(), r = (k) => esc(s(k)).replace(/\{insurer\}/g, ins()).replace('{contact}', esc(a.contactId || ''));
  const terms = [t(`plans.${p.id}.cancel`), t(`plans.${p.id}.cooling`)].filter(Boolean).join(' ') || t('p5.noWording');
  el.innerHTML = `<h1 class="t-title">${s('h1')}</h1><div class="box accent">
    <p class="t-body"><b>${s('status')}:</b> ${s('active')}</p>
    <p class="t-body"><b>${s('policy')}:</b> ${a.policyNo}</p><p class="t-body"><b>${s('dates')}:</b> ${a.startDate} ${s('to')} ${a.endDate}</p>
    <p class="t-body"><b>${s('amount')}:</b> ${price(a.paid)}</p><p class="t-body">${pname()}. ${r('issued')}</p></div>
    <div class="stack"><p class="t-body">${r('pdf')}</p><p class="t-body">${r('claims')}</p><p class="t-body">${r('cancel').replace('{terms}', esc(terms))}</p><p class="t-body">${r('renewal')}</p><p class="t-meta">${r('complaints')}</p></div>
    <div class="row"><button type="button" class="btn btn-quiet" data-again>${s('again')}</button></div>`;
  el.querySelector('[data-again]').onclick = () => { state.answers = {}; setAnswers({}); go('p1'); };
};
