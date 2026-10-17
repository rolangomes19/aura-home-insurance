// Pure functions, no DOM. The only place prices are computed (brief 6.1, 7, 8, 9).
import { ELIGIBILITY, PLANS, PLAN_ORDER, ADDONS, ADDON_COVER, MOBILE_PREFIXES } from './domain.js';

// Not eligible beats referred. Unanswered questions never trigger a rule.
// -> { status: 'ok' } | { status: 'ineligible'|'referred', variant, screen, route: 'help' }
export function eligibility(a) {
  const hits = ELIGIBILITY.filter((r) => r.test(a));
  const hit = hits.find((r) => r.outcome === 'not_eligible') || hits[0];
  if (!hit) return { status: 'ok' };
  return { status: hit.outcome === 'not_eligible' ? 'ineligible' : 'referred', variant: hit.variant, screen: hit.screen, route: 'help' };
}

// Fit rule 8.1 to 8.2: role allowed, then every chosen cover included. Reason keys feed the "does not fit" copy.
export function fits(plan, a) {
  if (!plan.roles.includes(a.role)) return { fits: false, reason: 'role' };
  const missing = (a.covers || []).filter((c) => !plan.covers.includes(c));
  if (missing.length) return { fits: false, reason: missing.includes('building') ? 'no_building' : 'cover' };
  return { fits: true };
}

// 7.1 base: band prices for the chosen covers plus building rate x rebuild value (rounded).
// null while a needed value is missing.
export function basePrice(plan, a) {
  const covers = a.covers || [];
  if (!covers.length) return null;
  let sum = 0;
  for (const c of covers) {
    const p = c === 'building'
      ? (plan.rates.buildingPct && a.rebuildValue ? Math.round((a.rebuildValue * plan.rates.buildingPct) / 100) : null)
      : c === 'contents' ? plan.rates.contents[a.contentsBand] : plan.rates.belongings[a.belongingsBand];
    if (p == null) return null;
    sum += p;
  }
  return sum;
}

// 'offered' (toggle) | 'included' (in base) | 'none' (not offered) | 'blocked' (needs contents cover)
export function addOnState(plan, id, a) {
  const x = plan.addons[id];
  if (!x) return 'none';
  if (!(a.covers || []).includes(ADDON_COVER)) return 'blocked';
  return x.included ? 'included' : 'offered';
}

// 7.1 to 7.4. sel = [{ id, qty }]. Add-ons the plan does not offer as a toggle add 0, so the same
// selection can price every collapsed row like for like.
export function getTotals(plan, a, sel = []) {
  const base = basePrice(plan, a);
  if (base == null) return null;
  const addOns = sel.filter((x) => addOnState(plan, x.id, a) === 'offered')
    .map((x) => { const qty = ADDONS[x.id].perUnit ? x.qty || 1 : 1; return { id: x.id, qty, amount: plan.addons[x.id].price * qty }; });
  const totalNow = base + addOns.reduce((s, x) => s + x.amount, 0);
  const ifAdded = {};
  for (const id of Object.keys(plan.addons))
    if (addOnState(plan, id, a) === 'offered' && !sel.some((x) => x.id === id)) ifAdded[id] = totalNow + plan.addons[id].price;
  return { base, addOns, discount: null, totalNow, ifAdded };
}

// All plans in display order with fit result and base price.
export const offers = (a, plans = PLAN_ORDER.map((id) => PLANS[id])) =>
  plans.map((plan) => { const f = fits(plan, a); return { plan, ...f, base: f.fits ? basePrice(plan, a) : null }; });

// P2 live range: base totals (no add-ons) of the plans that fit.
export function rangeFor(a) {
  const b = offers(a).filter((o) => o.fits && o.base != null).map((o) => o.base);
  return b.length ? { min: Math.min(...b), max: Math.max(...b) } : null;
}

// Plan switch (5.4): keep add-ons the new plan offers as a toggle; drop the rest.
// notices list the ones removed because the new plan does not offer them.
export function carryAddOns(plan, a, sel = []) {
  const keep = [], removed = [];
  for (const x of sel) {
    const s = addOnState(plan, x.id, a);
    if (s === 'offered') keep.push(x);
    else if (s !== 'included') removed.push(x.id);
  }
  return { sel: keep, removed };
}

// Extras a plan gives at no charge for these answers: included add-ons plus covers the user did not choose.
export const extrasOf = (plan, a) =>
  Object.keys(plan.addons).filter((id) => addOnState(plan, id, a) === 'included').length +
  plan.alsoIncludes.filter((c) => !(a.covers || []).includes(c)).length;

const mainCover = (a) => {
  const c = a.covers || [];
  return c.includes('contents') ? 'contents' : c.includes('personal_belongings') ? 'belongings' : null;
};

// Rule 8.2 to 8.7. priority comes from "What matters most?": 'excess' (default, brief rule 8.4),
// 'price' or 'extras'. Never ranks by what Aura earns (BR9).
// -> { planId, reason: { type, main, excess }, gap } | null
export function suggest(list, a, priority = 'excess') {
  const fit = list.filter((o) => o.fits);
  if (!fit.length) return null;
  const minBase = Math.min(...fit.map((o) => o.base ?? Infinity));
  const gapOf = (o) => (o.base != null && o.base > minBase ? o.base - minBase : 0);
  if (fit.length === 1) return { planId: fit[0].plan.id, reason: { type: 'only' }, gap: 0 };

  const main = mainCover(a);
  const limitKey = main === 'contents' ? 'singleItemContents' : main === 'belongings' ? 'singleItemBelongings' : null;
  let pool = fit, type = null;
  if (limitKey && a.highestItem != null) {
    const ok = fit.filter((o) => o.plan.limits[limitKey] >= a.highestItem);
    if (ok.length && ok.length < fit.length) { pool = ok; type = 'item_limit'; }
  }
  const ex = (o) => (main ? o.plan.excess[main] : null) ?? Infinity;
  const pr = (o) => o.base ?? Infinity;
  const extras = (o) => -extrasOf(o.plan, a);
  const keys = { excess: [['lowest_excess', ex], ['lowest_price', pr]], price: [['lowest_price', pr]], extras: [['most_extras', extras], ['lowest_excess', ex], ['lowest_price', pr]] }[priority];
  const sorted = [...pool].sort((x, y) => { for (const [, k] of keys) { const d = k(x) - k(y); if (d) return d; } return 0; });
  const best = sorted[0];
  // The deciding fact is the first key that sets the best plan apart from the others
  if (!type) type = keys.find(([, k]) => k(best) !== Infinity && pool.some((o) => k(o) !== k(best)))?.[0] ?? 'lowest_price';
  return { planId: best.plan.id, reason: { type, main, excess: ex(best) === Infinity ? null : ex(best) }, gap: gapOf(best) };
}

// P3 sort for the collapsed rows only.
export function sortOffers(list, key, a) {
  const main = mainCover(a);
  const f = { price: (o) => o.base ?? Infinity, excess: (o) => (main ? o.plan.excess[main] : null) ?? Infinity }[key];
  return f ? [...list].sort((x, y) => f(x) - f(y)) : list;
}

// Answers that change the base price. Used for the "Base changed because you changed [answer]" line (7.3).
export const PRICE_FIELDS = ['role', 'covers', 'rebuildValue', 'contentsBand', 'belongingsBand'];
export const priceSig = (a) => JSON.stringify(PRICE_FIELDS.map((k) => a[k] ?? null));
export const changedField = (prev, a) => PRICE_FIELDS.find((k) => JSON.stringify(prev?.[k] ?? null) !== JSON.stringify(a[k] ?? null)) ?? null;

// P2: which covers have a highest item above the single item limit (must be listed, F5, F9)
export function listingNotes(a) {
  const covers = a.covers || [];
  const notes = [];
  if (covers.includes('contents') && a.highestItem > 40000) notes.push('contents');
  if (!covers.includes('contents') && covers.includes('personal_belongings') && a.highestItem > 10000) notes.push('belongings');
  return notes;
}

// P4 mobile format: 05x or +971 5x, then 7 digits (K5)
export function validMobile(s) {
  const d = String(s).replace(/[\s-]/g, '').replace(/^\+971/, '0');
  return /^05\d{8}$/.test(d) && MOBILE_PREFIXES.includes(d.slice(1, 3));
}
