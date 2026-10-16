// S05 plans and S06 plan details.
import { screens, state, setAnswers, t, esc, price, tip } from './app.js';
import './copy-plans.js';
import { PLANS, DETAILS, ROLES } from './domain.js';
import { offers, suggest, sortOffers } from './engine.js';

const A = () => state.answers;
const go = (id) => { location.hash = '#/' + id; };
const aed = (n) => 'AED ' + n.toLocaleString('en-US');
let seen = '';      // answers the skeleton already ran for
let sortKey = 'suggested';

const val = (plan, n) => (n == null ? t('s05.notStated') : aed(n) + (plan.placeholder ? ' [P]' : ''));
function rows(plan) {
  const s = (k) => t('s05.rows.' + k), l = plan.limits, x = plan.excess;
  const assist = plan.homeAssistance ? t('s05.assistText').replace('{n}', plan.homeAssistance.callOuts).replace('{amt}', plan.homeAssistance.upTo.toLocaleString('en-US')) : t('s05.notIncluded');
  const cool = plan.coolingOffDays ? t('s05.coolingText').replace('{n}', plan.coolingOffDays) : t('s05.notStated');
  const covers = plan.covers.filter((c) => c !== 'home_assistance').map((c) => t('values.' + c)).join(', ');
  return [
    [s('covers'), covers], [s('limitContents'), val(plan, l.singleItemContents)], [s('limitBelongings'), val(plan, l.singleItemBelongings)],
    [s('excessContents'), val(plan, x.contents)], [s('excessBelongings'), val(plan, x.belongings)], [s('assistance'), assist],
    [s('cooling'), cool], [s('cancel'), plan.cancellation || t('s05.notStated')],
  ].map(([k, v]) => `<dt class="t-meta">${k}</dt><dd class="t-body">${esc(v)}</dd>`).join('');
}

function reason(sg, a) {
  const r = sg.reason, f = (k) => t('s05.facts.' + k);
  if (r.type === 'only') return f('only');
  const fact = f(r.type).replace('{x}', aed(a.highestItem ?? 0)).replace('{n}', r.excess).replace('{main}', t('s05.main.' + r.main));
  return `${t('s05.reasonCovers').replace('{covers}', a.covers.map((c) => t('values.' + c).toLowerCase()).join(', '))} ${fact} ${t('s05.reasonEnd')}`;
}

function draw(el) {
  const a = A();
  const list = offers(a);
  if (!list.some((o) => o.fits)) return go('e1'); // 0 plans fit: no dead end
  const sg = suggest(list, a);
  const ordered = sortKey === 'suggested'
    ? [...list].sort((x, y) => (y.fits - x.fits) || ((y.plan.id === sg.planId) - (x.plan.id === sg.planId)))
    : sortOffers(list, sortKey);
  const card = (o) => {
    const p = o.plan, rec = p.id === sg.planId;
    if (!o.fits) return `<div class="card no"><p class="t-h2">${p.name}</p><p class="t-body">${t('s05.noFit.' + o.reason)}</p></div>`;
    const also = p.covers.includes('home_assistance') ? `<p class="t-meta">${t('s05.also').replace('{x}', t('values.home_assistance'))}</p>` : '';
    return `<div class="card${rec ? ' rec' : ''}"><div class="row between"><p class="t-h2">${p.name}</p>${rec ? `<span class="tag rec t-meta">${t('s05.suggested')}</span>` : ''}</div>
      ${p.placeholder ? `<p class="t-meta">${t('s05.sample')}</p>` : ''}
      ${rec ? `<p class="t-body">${esc(reason(sg, a))}</p>` : ''}
      <p class="t-body">${price(o.price)}</p>${also}
      <dl class="rows">${rows(p)}</dl>
      <div class="row"><button class="btn btn-quiet" data-details="${p.id}">${t('s05.details')}</button><button class="btn btn-primary" data-choose="${p.id}">${t('s05.choose')}</button></div></div>`;
  };
  el.innerHTML = `<h1 class="t-title">${t('s05.h1')}</h1><p class="t-meta">${t('s05.range')}</p>
    <div class="field"><label class="t-body" for="sort">${t('s05.sortBy')}</label><select id="sort">${['suggested', 'price', 'excess'].map((k) => `<option value="${k}"${k === sortKey ? ' selected' : ''}>${t('s05.sorts.' + k)}</option>`).join('')}</select></div>
    <div class="plans">${ordered.map(card).join('')}</div>
    <div class="row"><button type="button" class="btn btn-quiet" data-back>${t('back')}</button></div>`;
  el.querySelector('#sort').onchange = (e) => { sortKey = e.target.value; draw(el); el.querySelector('#sort').focus(); };
  el.onclick = (e) => {
    const d = e.target.closest('[data-details]'), c = e.target.closest('[data-choose]');
    if (d) { setAnswers({ viewPlan: d.dataset.details }); go('s06'); }
    if (c) { setAnswers({ planId: c.dataset.choose }); go('s07'); }
  };
}

screens.s05 = (el) => {
  const a = A();
  if (!a.covers) return go('s03');
  const sig = JSON.stringify([a.role, a.covers, a.highestItem, a.contentsValue, a.rebuildValue, a.belongingsBand]);
  if (sig === seen) return draw(el);
  el.innerHTML = `<h1 class="t-title">${t('s05.h1')}</h1><p class="t-body" role="status">${t('s05.loading')}</p>` +
    '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  setTimeout(() => { if (location.hash === '#/s05') { seen = sig; draw(el); } }, 1500);
};

screens.s06 = (el) => {
  const a = A(), plan = PLANS[a.viewPlan];
  if (!plan || !a.covers) return go('s05');
  const s = (k) => t('s06.' + k), d = DETAILS[plan.id];
  const list = (arr) => `<ul class="t-body">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const o = offers(a).find((x) => x.plan.id === plan.id);
  const x = plan.excess;
  const excess = [`${t('s05.rows.excessContents')}: ${val(plan, x.contents)}`, `${t('s05.rows.excessBelongings')}: ${val(plan, x.belongings)}`,
    ...(x.portable ? [`Portable equipment or valuables: ${aed(x.portable)}`] : []), s('overLimit').replace('{n}', x.overLimitPct)];
  const cancel = [plan.cancellation || t('s05.notStated'), `${t('s05.rows.cooling')}: ${plan.coolingOffDays ? t('s05.coolingText').replace('{n}', plan.coolingOffDays) : t('s05.notStated')}`];
  const fold = (title, body, open) => `<details class="fold"${open ? ' open' : ''}><summary class="t-h2">${title}</summary>${body}</details>`;
  el.innerHTML = `<h1 class="t-title">${plan.name}</h1>${plan.placeholder ? `<p class="t-meta">${t('s05.sample')}</p>` : ''}
    ${o.fits ? `<p class="t-body">${price(o.price)}</p>` : ''}
    ${fold(s('covered'), list(d.covered), true)}${fold(s('limits'), `<p class="t-meta">${tip(s('termLimit'), s('limitTip'))}</p>` + list(d.limits))}
    ${fold(s('excess'), `<p class="t-meta">${tip(s('termExcess'), s('excessTip'))}</p>` + list(excess))}
    ${fold(s('notCovered'), list(d.notCovered))}${fold(s('cancel'), list(cancel))}
    ${fold(s('docs'), `<p class="t-body">${s(ROLES[a.role].documents === 'owner' ? 'docsOwner' : 'docsTenant')}</p>`)}
    <p class="t-meta">${s('verify')}</p>
    <div class="row between"><button type="button" class="btn btn-quiet" data-back>${t('back')}</button>
    ${o.fits ? `<button class="btn btn-primary" data-choose>${t('s05.choose')}</button>` : ''}</div>`;
  el.onclick = (e) => { if (e.target.closest('[data-choose]')) { setAnswers({ planId: plan.id }); go('s07'); } };
};
