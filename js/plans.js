// P3 plans and price: suggested plan open, other plans collapsed with prices, add-ons, live price panel,
// details drawer (brief 5.4, 7). Every price comes from engine.js.
import { screens, state, setAnswers, t, esc, price, tip, aed, roll } from './app.js';
import './copy-plans.js';
import { PLANS, ROLES, ADDONS, ADDON_ORDER } from './domain.js';
import { offers, suggest, sortOffers, getTotals, addOnState, carryAddOns, eligibility, changedField, priceSig, PRICE_FIELDS } from './engine.js';
import { go, markSaved } from './screens.js';

const A = () => state.answers;
let seen = '';         // answers the skeleton already ran for
let sortKey = 'suggested';
let open = new Set();  // collapsed rows showing their compare rows
let compare = false;
let notices = [];      // one-line notices shown on the next draw
let shown = null;      // total last shown on the active plan, so a redraw counts from it

const name = (id) => t('plans.' + id + '.name');
const nameOf = (id) => t('values.' + id);
const lab = () => `<span class="price-label">${t('priceLabel')}</span>`;
const sel = () => A().addOns || [];
const val = (n) => (n == null ? t('p3.notStated') : aed(n));
const assistOf = (plan, a) => ({ offered: t('p3.paid'), included: t('p3.included'), blocked: t('p3.notOffered'), none: t('p3.notOffered') }[addOnState(plan, 'home_assistance', a)]);
const textOr = (k) => t(k) ?? t('p3.notStated');

// Full comparison rows, the same for every plan (D26)
function rows(plan, a) {
  const r = (k) => t('p3.rows.' + k), l = plan.limits, x = plan.excess;
  return [
    [r('covers'), plan.covers.map(nameOf).join(t('sep'))], [r('limitContents'), val(l.singleItemContents)], [r('limitBelongings'), val(l.singleItemBelongings)],
    [r('excessContents'), val(x.contents)], [r('excessBelongings'), val(x.belongings)], [r('assistance'), assistOf(plan, a)],
    [r('cooling'), textOr(`plans.${plan.id}.cooling`)], [r('cancel'), textOr(`plans.${plan.id}.cancel`)],
  ].map(([k, v]) => `<dt class="t-meta">${k}</dt><dd class="t-body">${esc(v)}</dd>`).join('');
}

const extrasList = (plan, a) => [
  ...plan.alsoIncludes.filter((c) => !a.covers.includes(c)).map(nameOf),
  ...ADDON_ORDER.filter((id) => addOnState(plan, id, a) === 'included').map(nameOf),
];

function reason(sg, a) {
  const r = sg.reason, f = (k) => t('p3.facts.' + k);
  const fact = f(r.type).replace('{n}', r.excess).replace('{main}', t('p3.main.' + r.main));
  const gap = sg.gap ? ' ' + t('p3.gap').replace('{d}', sg.gap.toLocaleString('en-US')) : '';
  if (r.type === 'only') return `${fact} ${t('p3.reasonEnd')}`;
  return `${t('p3.reasonCovers').replace('{covers}', a.covers.map((c) => nameOf(c).toLowerCase()).join(t('sep')))} ${fact}${gap} ${t('p3.reasonEnd')}`;
}

// Add-on section inside the active plan (5.4): all off by default, limits in place, "Total would be"
function addOnSection(plan, a, tot) {
  const s = (k) => t('p3.' + k);
  const ids = ADDON_ORDER.filter((id) => plan.addons[id]);
  let body;
  if (!a.covers.includes('contents')) body = `<p class="t-body">${s('buildingOnly')}</p>`;
  else {
    body = ids.map((id) => {
      const st = addOnState(plan, id, a), d = (k) => esc(t(`addons.${id}.${k}`));
      if (st === 'included') return `<div class="addon"><p class="t-body"><b>${d('name')}</b> <span class="tag">${s('includedLine')}</span></p><p class="t-meta">${d('desc')} ${d('limits')}</p></div>`;
      const on = sel().find((x) => x.id === id);
      const p = plan.addons[id].price;
      return `<div class="addon"><label class="opt"><input type="checkbox" id="ao-${id}" data-addon="${id}"${on ? ' checked' : ''}><span><b>${d('name')}</b><span class="t-meta">${d('desc')}</span></span></label>
        <p class="t-meta">${d('limits')}</p>
        <p class="t-body">${price(p, ADDONS[id].perUnit ? s('perPerson') : '')}</p>
        ${on ? (ADDONS[id].perUnit ? `<div class="field"><label class="t-body" for="qty-${id}">${s('staffQty')}</label><input type="number" id="qty-${id}" data-qty="${id}" min="1" max="${ADDONS[id].maxQty}" inputmode="numeric" value="${on.qty || 1}"></div>` : '')
        : `<p class="t-body">${s('totalWould').replace('{x}', `<b>${aed(tot.ifAdded[id])}</b>`)} ${lab()}</p>`}</div>`;
    }).join('');
    if (!ids.some((id) => addOnState(plan, id, a) === 'offered')) body += `<p class="t-body">${s('noAddons')}</p>`;
  }
  return `<fieldset class="addons"><legend class="t-h2">${s('addonsTitle')}</legend>${body}</fieldset>`;
}

// Persistent price panel: right column at 1280, sticky bottom bar below (7.2). Kept across draws so aria-live announces.
function paintPanel(plan, tot) {
  const slot = document.querySelector('#price-slot'), p = (k) => t('p3.panel.' + k);
  if (!slot.querySelector('#pricebar')) {
    slot.innerHTML = `<details class="pricebar panel" id="pricebar"${matchMedia('(min-width:1280px)').matches ? ' open' : ''}>
      <summary><span class="t-body">${p('total')}</span> <b id="pb-total"><span id="pb-num" aria-hidden="true"></span> <span class="pb-unit">${t('perYear')}</span></b>
        <span class="sr-only" id="pb-live" aria-live="polite"></span></summary>
      <p class="price-label">${t('priceLabel')}</p><dl class="rows" id="pb-rows"></dl></details>`;
  }
  const add = tot.addOns.length ? tot.addOns.map((x) => `${nameOf(x.id)}${x.qty > 1 ? ` × ${x.qty}` : ''}: ${aed(x.amount)}`).join('<br>') : p('none');
  const num = slot.querySelector('#pb-num');
  roll(num, num.dataset.v == null ? null : Number(num.dataset.v), tot.totalNow);
  num.dataset.v = tot.totalNow;
  slot.querySelector('#pb-live').textContent = `${aed(tot.totalNow)} ${t('perYear')}`;
  slot.querySelector('#pb-rows').innerHTML = `<dt class="t-meta">${esc(name(plan.id))}</dt><dd></dd>
    <dt class="t-meta">${p('base')}</dt><dd class="t-body">${aed(tot.base)}</dd>
    <dt class="t-meta">${p('addons')}</dt><dd class="t-body">${add}</dd>
    <dt class="t-meta">${p('total')}</dt><dd class="t-body"><b>${aed(tot.totalNow)}</b> ${t('perYear')}</dd>`;
}

function drawer(plan, a, active) {
  const d = (k) => t('drawer.' + k), x = plan.excess, l = plan.limits;
  const list = (arr) => `<ul class="t-body">${arr.map((v) => `<li>${esc(v)}</li>`).join('')}</ul>`;
  const fold = (title, body, isOpen) => `<details class="fold"${isOpen ? ' open' : ''}><summary class="t-h2">${title}</summary>${body}</details>`;
  const tot = getTotals(plan, a, sel());
  const covered = [...a.covers.map(nameOf), ...extrasList(plan, a)];
  const limits = [`${t('p3.rows.limitContents')}: ${val(l.singleItemContents)}`, `${t('p3.rows.limitBelongings')}: ${val(l.singleItemBelongings)}`, ...t(`plans.${plan.id}.limits`)];
  const excess = [`${t('p3.rows.excessContents')}: ${val(x.contents)}`, `${t('p3.rows.excessBelongings')}: ${val(x.belongings)}`,
    d('portable').replace('{x}', val(x.portable)), d('overLimit').replace('{n}', x.overLimitPct)];
  const cancel = [`${t('p3.rows.cancel')}: ${textOr(`plans.${plan.id}.cancel`)}`, `${t('p3.rows.cooling')}: ${textOr(`plans.${plan.id}.cooling`)}`];
  return `<dialog id="drawer" class="drawer" aria-labelledby="drawer-h"><div class="stack">
    <div class="row between"><p class="t-meta"><bdi dir="ltr">${t('p3.insurer').replace('{x}', plan.insurer)}</bdi></p><button type="button" class="btn btn-quiet" data-close>${d('close')}</button></div>
    <h2 class="t-title" id="drawer-h">${esc(name(plan.id))}</h2>${plan.isInvented ? `<p class="t-meta">${t('p3.sample')}</p>` : ''}
    <p class="t-body">${price(tot.totalNow)}</p>
    ${fold(d('covered'), list(covered), true)}${fold(d('limits'), `<p class="t-meta">${tip(...t('drawer.limitTip'))}</p>` + list(limits))}
    ${fold(d('excess'), `<p class="t-meta">${tip(...t('drawer.excessTip'))}</p>` + list(excess))}
    ${fold(d('notCovered'), list(t(`plans.${plan.id}.notCovered`)))}${fold(d('cancel'), list(cancel))}
    ${fold(d('docs'), `<p class="t-body">${d(ROLES[a.role].documents === 'owner' ? 'docsOwner' : 'docsTenant')}</p>`)}
    <p class="t-meta">${d('verify')}</p>
    ${active ? '' : `<button type="button" class="btn btn-primary" data-choose="${plan.id}">${t('p3.choose')}</button>`}</div></dialog>`;
}

function draw(el) {
  const a = A(), s = (k) => t('p3.' + k);
  const list = offers(a), fit = list.filter((o) => o.fits);
  const sg = suggest(list, a, a.priority || 'excess');

  // 7.3: plan no longer fits -> back here with a notice; add-on no longer allowed -> removed with a notice
  if (a.planId && !fit.some((o) => o.plan.id === a.planId)) { notices.push(s('noLongerFits').replace('{plan}', name(a.planId))); setAnswers({ planId: null }); }
  const activeId = a.planId || sg.planId, plan = PLANS[activeId];
  const carry = carryAddOns(plan, a, sel());
  if (carry.removed.length || carry.sel.length !== sel().length) {
    carry.removed.forEach((id) => notices.push(s('removed').replace('{x}', nameOf(id)).replace('{plan}', name(activeId))));
    setAnswers({ addOns: carry.sel });
  }
  const tot = getTotals(plan, a, sel());
  const q = a.quoted;
  if (q?.planId === activeId && q.base !== tot.base) {
    const f = changedField(q.answers, a);
    notices.push(s('baseChanged').replace('{x}', aed(q.base)).replace('{y}', aed(tot.base)).replace('{answer}', t('labels.' + (f || 'covers')).toLowerCase()));
  }

  const tagFor = (id) => (id === sg.planId ? `<span class="tag rec t-meta">${s('suggested')}</span>` : '');
  const insurer = (p) => `<bdi dir="ltr">${p.insurer}</bdi>`;
  const sample = (p) => (p.isInvented ? `<p class="t-meta">${s('sample')}</p>` : '');
  const extras = extrasList(plan, a);
  const key = (k, v) => `<dt class="t-meta">${s('rows.' + k)}</dt><dd class="t-body">${esc(v)}</dd>`;

  const active = `<section class="card rec" aria-labelledby="active-h">
    <div class="row between"><h2 class="t-h2" id="active-h" tabindex="-1">${esc(name(activeId))}</h2>${tagFor(activeId)}</div>
    <p class="t-meta">${t('p3.insurer').replace('{x}', insurer(plan))}</p>${sample(plan)}
    <p class="t-body">${esc(s('coversIncluded').replace('{x}', a.covers.map(nameOf).join(t('sep'))))}</p>
    ${extras.length ? `<p class="t-body">${esc(s('also').replace('{x}', extras.join(t('sep'))))}</p>` : ''}
    ${activeId === sg.planId ? `<p class="t-body">${esc(reason(sg, a))}</p>` : ''}
    <p class="t-body price-big">${price(tot.totalNow)}</p>
    <dl class="rows keyrows">${key('excessContents', val(plan.excess.contents))}${key('limits', s('limitsText').replace('{c}', aed(plan.limits.singleItemContents)).replace('{b}', aed(plan.limits.singleItemBelongings)))}${key('assistance', assistOf(plan, a))}${key('cooling', textOr(`plans.${activeId}.cooling`))}</dl>
    <button type="button" class="link" id="drawer-${activeId}" data-drawer="${activeId}">${s('details')}</button>
    ${addOnSection(plan, a, tot)}</section>`;

  // Other plans that fit: collapsed, priced like for like with the add-on types chosen above (7.4)
  let others = fit.filter((o) => o.plan.id !== activeId);
  if (sortKey !== 'suggested') others = sortOffers(others, sortKey, a);
  const row = (o) => {
    const p = o.plan, rt = getTotals(p, a, sel());
    const note = sel().flatMap((x) => {
      const st = addOnState(p, x.id, a);
      return st === 'offered' ? [] : [s(st === 'included' ? 'noteIncluded' : 'noteNone').replace('{x}', nameOf(x.id))];
    }).join('. ');
    const isOpen = open.has(p.id);
    return `<div class="card">
      <div class="row between"><p class="t-h2">${esc(name(p.id))}</p>${tagFor(p.id)}</div>
      <p class="t-meta">${t('p3.insurer').replace('{x}', insurer(p))}</p>${sample(p)}
      <p class="t-body">${price(rt.totalNow)}</p>
      <ul class="facts t-meta"><li>${s('rows.excessContents')}: ${val(p.excess.contents)}</li><li>${s('rows.cooling')}: ${esc(textOr(`plans.${p.id}.cooling`))}</li><li>${s('rows.assistance')}: ${assistOf(p, a)}</li></ul>
      ${note ? `<p class="t-body">${esc(note)}</p>` : ''}
      <div class="row"><button type="button" class="btn btn-quiet" id="toggle-${p.id}" data-toggle="${p.id}" aria-expanded="${isOpen}">${s(isOpen ? 'hideDetails' : 'showDetails')}</button>
      <button type="button" class="btn btn-outline" id="choose-${p.id}" data-choose="${p.id}">${s('choose')}</button></div>
      ${isOpen ? `<dl class="rows">${rows(p, a)}</dl>` : ''}</div>`;
  };
  const noFit = list.filter((o) => !o.fits);
  const pr = a.priority || 'excess';

  el.innerHTML = `<h1 class="t-title">${s('h1')}</h1><p class="t-meta">${s('range')}</p>
    <fieldset class="field"><legend class="t-body"><b>${s('priority.label')}</b></legend><div class="row">${['excess', 'price', 'extras'].map((k) =>
      `<label class="chip-opt"><input type="radio" name="priority" id="pr-${k}" value="${k}"${pr === k ? ' checked' : ''}><span>${s('priority.' + k)}</span></label>`).join('')}</div></fieldset>
    ${notices.length ? `<div class="change t-body" role="status">${notices.map(esc).join('<br>')}</div>` : ''}
    ${active}
    ${others.length ? `<section class="stack" aria-labelledby="others-h"><div class="row between"><h2 class="t-h2" id="others-h">${s('otherHeading')}</h2>
      <div class="field"><label class="t-meta" for="sort">${s('sortBy')}</label><select id="sort">${['suggested', 'price', 'excess'].map((k) => `<option value="${k}"${k === sortKey ? ' selected' : ''}>${s('sorts.' + k)}</option>`).join('')}</select></div></div>
      ${others.map(row).join('')}</section>` : ''}
    ${fit.length > 1 ? `<button type="button" class="btn btn-quiet" id="compare" data-compare aria-expanded="${compare}">${s(compare ? 'hideCompare' : 'compare')}</button>` : ''}
    ${compare ? `<div class="plans">${fit.map((o) => `<div class="card"><p class="t-h2">${esc(name(o.plan.id))}</p><p class="t-meta">${insurer(o.plan)}</p>${sample(o.plan)}<p class="t-body">${price(getTotals(o.plan, a, sel()).totalNow)}</p><dl class="rows">${rows(o.plan, a)}</dl></div>`).join('')}</div>` : ''}
    ${noFit.length ? `<section class="stack"><h2 class="t-h2">${s('noFitHeading')}</h2>${noFit.map((o) => `<div class="card no"><p class="t-h2">${esc(name(o.plan.id))}</p><p class="t-meta">${insurer(o.plan)}</p><p class="t-body">${s('noFit.' + o.reason)}</p></div>`).join('')}</section>` : ''}
    <div class="row between"><button type="button" class="btn btn-quiet" data-back>${t('back')}</button>
    <button type="button" class="btn btn-primary" data-continue>${esc(s('continue').replace('{plan}', name(activeId)))}</button></div>
    <div id="drawer-slot"></div>`;
  notices = [];
  roll(el.querySelector('.price-big .price b'), shown, tot.totalNow);
  shown = tot.totalNow;
  paintPanel(plan, tot);

  const redraw = (focus) => { draw(el); (focus && el.querySelector(focus))?.focus(); };
  const setAdd = (next) => { setAnswers({ addOns: next }); redraw('#' + document.activeElement?.id); };
  el.onclick = (e) => {
    const b = (k) => e.target.closest(`[data-${k}]`)?.dataset[k];
    const choose = b('choose'), toggle = b('toggle'), dr = b('drawer');
    if (choose) {
      el.querySelector('#drawer')?.close();
      const c = carryAddOns(PLANS[choose], a, sel());
      c.removed.forEach((id) => notices.push(s('removed').replace('{x}', nameOf(id)).replace('{plan}', name(choose))));
      setAnswers({ planId: choose, addOns: c.sel });
      return redraw('#active-h');
    }
    if (toggle) { open.has(toggle) ? open.delete(toggle) : open.add(toggle); return redraw('#toggle-' + toggle); }
    if (e.target.closest('[data-compare]')) { compare = !compare; return redraw('#compare'); }
    if (dr) {
      el.querySelector('#drawer-slot').innerHTML = drawer(PLANS[dr], a, dr === activeId);
      const dlg = el.querySelector('#drawer');
      dlg.querySelector('[data-close]').onclick = () => dlg.close();
      dlg.addEventListener('close', () => el.querySelector('#drawer-' + activeId)?.focus());
      return dlg.showModal();
    }
    if (e.target.closest('[data-continue]')) {
      setAnswers({ planId: activeId, addOns: sel(), quoted: { planId: activeId, base: tot.base, total: tot.totalNow, answers: Object.fromEntries(PRICE_FIELDS.map((k) => [k, a[k] ?? null])) } });
      markSaved(); go('p4');
    }
  };
  el.onchange = (e) => {
    const t2 = e.target;
    if (t2.id === 'sort') { sortKey = t2.value; return redraw('#sort'); }
    if (t2.name === 'priority') { setAnswers({ priority: t2.value, planId: null }); return redraw('#' + t2.id); }
    if (t2.dataset.addon) {
      const id = t2.dataset.addon;
      return setAdd(t2.checked ? [...sel(), { id, qty: 1 }] : sel().filter((x) => x.id !== id));
    }
    if (t2.dataset.qty) {
      const id = t2.dataset.qty, qty = Math.min(ADDONS[id].maxQty, Math.max(1, Math.round(Number(t2.value)) || 1));
      return setAdd(sel().map((x) => (x.id === id ? { ...x, qty } : x)));
    }
  };
}

screens.p3 = (el) => {
  const a = A();
  if (!a.covers) return go('p2');
  if (eligibility(a).status !== 'ok') return go('help');
  const list = offers(a);
  if (!list.some((o) => o.fits)) return go('help'); // 0 plans fit: no dead end (8.4)
  if (list.some((o) => o.fits && o.base == null)) return go('p2'); // a value is missing
  shown = null; // a fresh visit shows the price without counting
  const sig = priceSig(a) + a.highestItem;
  if (sig === seen) return draw(el);
  el.innerHTML = `<h1 class="t-title">${t('p3.h1')}</h1><p class="t-body" role="status">${t('p3.loading')}</p>` +
    '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  setTimeout(() => { if (location.hash.startsWith('#/p3')) { seen = sig; draw(el); } }, 1500); // fake delay [Invented]
};

