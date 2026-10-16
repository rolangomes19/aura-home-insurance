// Pure functions, no DOM. Spec 5.3 (fit), 5.6 (suggestion), 5.5 (price), 10.3 (eligibility).
import { ELIGIBILITY, PLANS, PLAN_ORDER, PRICES, ADDON_PRICES, MOBILE_PREFIXES } from './domain.js';

// Not-eligible beats referred. Unanswered questions never trigger a rule.
// -> { status: 'ok' } | { status: 'ineligible'|'referred', variant, screen, route: 'e1'|'e2' }
export function eligibility(a) {
  const hits = ELIGIBILITY.filter((r) => r.test(a));
  const hit = hits.find((r) => r.outcome === 'not_eligible') || hits[0];
  if (!hit) return { status: 'ok' };
  const ineligible = hit.outcome === 'not_eligible';
  return { status: ineligible ? 'ineligible' : 'referred', variant: hit.variant, screen: hit.screen, route: ineligible ? 'e1' : 'e2' };
}

// Fit rule: role allowed, then every chosen cover included. Reason keys feed the "does not fit" copy.
export function fits(plan, a) {
  if (!plan.roles.includes(a.role)) return { fits: false, reason: 'role' };
  const missing = (a.covers || []).filter((c) => !plan.covers.includes(c));
  if (missing.length) return { fits: false, reason: missing.includes('building') ? 'no_building' : 'cover' };
  return { fits: true };
}

// Alphabetical cover order: building < contents < personal_belongings
export const priceKey = (a) => `${a.role}|${[...(a.covers || [])].sort().join('+')}`;

export const basePrice = (plan, a) => PRICES[plan.id]?.[priceKey(a)] ?? null;

// Illustrative total incl VAT. Add-ons count only when the plan offers them and the user switched them on.
export function total(plan, a, addons = []) {
  const base = basePrice(plan, a);
  if (base == null) return null;
  return base + addons.filter((x) => plan.addons.includes(x)).reduce((s, x) => s + ADDON_PRICES[x], 0);
}

// All plans in display order with fit result and price.
export const offers = (a, plans = PLAN_ORDER.map((id) => PLANS[id])) =>
  plans.map((plan) => ({ plan, ...fits(plan, a), price: fits(plan, a).fits ? basePrice(plan, a) : null }));

// 5.6: only fitting plans. One fit -> "only". Else prefer plans whose single item limit covers the
// highest item; then lowest excess on the main cover; tie -> lower total. Never ranks by Aura earnings.
export function suggest(list, a) {
  const fit = list.filter((o) => o.fits);
  if (!fit.length) return null;
  if (fit.length === 1) return { planId: fit[0].plan.id, reason: { type: 'only' } };

  const covers = a.covers || [];
  const main = covers.includes('contents') ? 'contents' : covers.includes('personal_belongings') ? 'belongings' : null;
  const limitKey = main === 'contents' ? 'singleItemContents' : main === 'belongings' ? 'singleItemBelongings' : null;

  let pool = fit, type = null;
  if (limitKey && a.highestItem != null) {
    const ok = fit.filter((o) => o.plan.limits[limitKey] >= a.highestItem);
    if (ok.length && ok.length < fit.length) { pool = ok; type = 'item_limit'; }
  }
  const ex = (o) => (main ? o.plan.excess[main] : null) ?? Infinity;
  const pr = (o) => o.price ?? Infinity;
  const sorted = [...pool].sort((x, y) => (ex(x) - ex(y)) || (pr(x) - pr(y)));
  const best = sorted[0];
  if (!type) type = ex(best) !== Infinity && ex(best) !== ex(sorted[sorted.length - 1]) ? 'lowest_excess' : 'lowest_price';
  return { planId: best.plan.id, reason: { type, main, excess: ex(best) === Infinity ? null : ex(best) } };
}

// S05 sort: fitting plans first, then by the chosen key.
export function sortOffers(list, key) {
  const f = { price: (o) => o.price ?? Infinity, excess: (o) => o.plan.excess.contents ?? Infinity }[key];
  return f ? [...list].sort((x, y) => (y.fits - x.fits) || (f(x) - f(y))) : list;
}

// S04: which covers have a highest item above the single item limit (must be listed, F5, F9)
export function listingNotes(a) {
  const covers = a.covers || [];
  const notes = [];
  if (covers.includes('contents') && a.highestItem > 40000) notes.push('contents');
  if (!covers.includes('contents') && covers.includes('personal_belongings') && a.highestItem > 10000) notes.push('belongings');
  return notes;
}

// S07 mobile format: 05x or +971 5x, then 7 digits (K5)
export function validMobile(s) {
  const d = String(s).replace(/[\s-]/g, '').replace(/^\+971/, '0');
  return /^05\d{8}$/.test(d) && MOBILE_PREFIXES.includes(d.slice(1, 3));
}
