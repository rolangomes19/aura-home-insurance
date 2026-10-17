import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibility, fits, offers, suggest, getTotals, rangeFor, carryAddOns, addOnState, listingNotes, validMobile, sortOffers, changedField, basePrice } from '../js/engine.js';
import { PLANS, COVER_OPTIONS, ROLES } from '../js/domain.js';

// Band indexes: contents 0 = 1-50k, 1 = 50,001-100k. Belongings 1 = 25,001-50k.
const A = { // Persona A (12.2)
  role: 'owner_living_in', propertyType: 'villa', emirate: 'dubai', age18Plus: true, emptyOver60: false,
  covers: ['building', 'contents', 'personal_belongings'], rebuildValue: 2000000, contentsBand: 1, belongingsBand: 1,
  highestItem: 45000, claims5y: false,
};
const B = { // Persona B
  role: 'tenant', tenancy12m: true, propertyType: 'apartment', emirate: 'abu_dhabi', age18Plus: true,
  emptyOver60: false, covers: ['contents'], contentsBand: 0, highestItem: 8000, claims5y: false,
};
const D = { // Persona D
  role: 'owner_renting_out', propertyType: 'apartment', emirate: 'dubai', age18Plus: true,
  emptyOver60: false, covers: ['building'], rebuildValue: 900000, claims5y: false,
};
const OWN_C = { ...A, covers: ['contents'], contentsBand: 0, highestItem: 8000 };
const OWN_CB = { ...A, covers: ['contents', 'personal_belongings'], contentsBand: 1, belongingsBand: 1, highestItem: 8000 };
const byId = (list) => Object.fromEntries(list.map((o) => [o.plan.id, o]));
const price = (a) => { const o = byId(offers(a)); return [o.A.fits ? o.A.base : 'no', o.B.fits ? o.B.base : 'no', o.C.fits ? o.C.base : 'no']; };
const sug = (a, p) => { const s = suggest(offers(a), a, p); return [s.planId, s.gap]; };

// ---- 12.1 price tests ----
test('12.1 tenant, contents 1-50k: A 289, B no fit, C 407, C suggested, gap 118', () => {
  assert.deepEqual(price(B), [289, 'no', 407]);
  assert.deepEqual(sug(B), ['C', 118]);
});
test('12.1 owner living in, contents only: 289 / 330 / 407, C suggested, gap 118', () => {
  assert.deepEqual(price(OWN_C), [289, 330, 407]);
  assert.deepEqual(sug(OWN_C), ['C', 118]);
});
test('12.1 owner living in, contents 50-100k + belongings 25-50k: 450 / 515 / 620, gap 170', () => {
  assert.deepEqual(price(OWN_CB), [450, 515, 620]);
  assert.deepEqual(sug(OWN_CB), ['C', 170]);
});
test('12.1 Persona A full cover: 1,450 / no fit / 1,920, C suggested, gap 470', () => {
  assert.deepEqual(price(A), [1450, 'no', 1920]);
  assert.equal(byId(offers(A)).B.reason, 'no_building');
  const s = suggest(offers(A), A);
  assert.deepEqual([s.planId, s.gap, s.reason.type, s.reason.excess], ['C', 470, 'lowest_excess', 150]);
});
test('12.1 Persona D building only: 450 / no fit / 585, A suggested on price, no gap line', () => {
  assert.deepEqual(price(D), [450, 'no', 585]);
  assert.equal(byId(offers(D)).B.reason, 'role');
  const s = suggest(offers(D), D);
  assert.deepEqual([s.planId, s.gap, s.reason.type], ['A', 0, 'lowest_price']);
});

// ---- 12.1 calculator tests (Persona A, Plan A active) ----
const tot = (plan, a, sel) => getTotals(PLANS[plan], a, sel);
test('calculator: base, add-ons and total now', () => {
  const rows = [
    [[], 0, 1450],
    [[{ id: 'domestic_staff', qty: 1 }], 83, 1533],
    [[{ id: 'domestic_staff', qty: 2 }], 166, 1616],
    [[{ id: 'home_assistance' }], 65, 1515],
    [[{ id: 'domestic_staff', qty: 1 }, { id: 'home_assistance' }], 148, 1598],
  ];
  for (const [sel, add, total] of rows) {
    const t = tot('A', A, sel);
    assert.equal(t.base, 1450);
    assert.equal(t.addOns.reduce((s, x) => s + x.amount, 0), add);
    assert.equal(t.totalNow, total);
  }
});
test('calculator: "Total would be" on each unselected toggle', () => {
  assert.deepEqual(tot('A', A, []).ifAdded, { domestic_staff: 1533, home_assistance: 1515 });
  assert.deepEqual(tot('A', A, [{ id: 'home_assistance' }]).ifAdded, { domestic_staff: 1598 });
});
test('collapsed rows price like for like (7.4)', () => {
  assert.equal(tot('C', A, [{ id: 'home_assistance' }]).totalNow, 1920); // included in C
  assert.equal(addOnState(PLANS.C, 'home_assistance', A), 'included');
  assert.equal(tot('C', A, [{ id: 'domestic_staff', qty: 1 }]).totalNow, 2015);
  assert.equal(byId(offers(A)).B.fits, false);
});
test('tenant add-ons: A + staff 372; C staff 502, cyber 485, both 580', () => {
  assert.equal(tot('A', B, [{ id: 'domestic_staff', qty: 1 }]).totalNow, 372);
  assert.equal(tot('C', B, [{ id: 'domestic_staff', qty: 1 }]).totalNow, 502);
  assert.equal(tot('C', B, [{ id: 'cyber' }]).totalNow, 485);
  assert.equal(tot('C', B, [{ id: 'domestic_staff', qty: 1 }, { id: 'cyber' }]).totalNow, 580);
});
test('plan switch: staff carries over, included add-on drops quietly, unoffered one is removed with a notice', () => {
  const sel = [{ id: 'domestic_staff', qty: 1 }, { id: 'home_assistance' }];
  const toC = carryAddOns(PLANS.C, A, sel);
  assert.deepEqual(toC, { sel: [{ id: 'domestic_staff', qty: 1 }], removed: [] });
  assert.equal(tot('C', A, toC.sel).totalNow, 2015);
  const toB = carryAddOns(PLANS.B, OWN_C, [{ id: 'domestic_staff', qty: 2 }, { id: 'cyber' }]);
  assert.deepEqual(toB, { sel: [], removed: ['domestic_staff', 'cyber'] });
});
test('add-ons need contents cover; building only has none', () => {
  assert.equal(addOnState(PLANS.A, 'domestic_staff', D), 'blocked');
  assert.deepEqual(tot('A', D, [{ id: 'domestic_staff', qty: 1 }]), { base: 450, addOns: [], discount: null, totalNow: 450, ifAdded: {} });
});
test('7.5 one source of truth: the same plan, answers and selection give the same total every time', () => {
  const sel = [{ id: 'domestic_staff', qty: 2 }];
  const p3 = tot('A', A, sel).totalNow, p5 = tot('A', { ...A }, [...sel]).totalNow, p7 = tot('A', JSON.parse(JSON.stringify(A)), sel).totalNow;
  assert.deepEqual([p3, p5, p7], [1616, 1616, 1616]);
});
test('B charges belongings only when chosen; otherwise it is an extra', () => {
  assert.equal(basePrice(PLANS.B, OWN_C), 330);
  assert.equal(basePrice(PLANS.B, OWN_CB), 515);
});
test('base is null until every needed value is set', () => {
  assert.equal(basePrice(PLANS.A, { ...A, rebuildValue: undefined }), null);
  assert.equal(basePrice(PLANS.A, { ...B, contentsBand: undefined }), null);
});

// ---- P2 range ----
test('P2 live range is min to max base of the fitting plans', () => {
  assert.deepEqual(rangeFor(A), { min: 1450, max: 1920 });
  assert.deepEqual(rangeFor(OWN_C), { min: 289, max: 407 });
  assert.equal(rangeFor({ ...A, belongingsBand: undefined }), null);
});

// ---- What matters most? ----
test('priority price suggests the lowest base; extras prefers included extras', () => {
  assert.deepEqual(sug(OWN_C, 'price'), ['A', 0]);
  const s = suggest(offers(OWN_C), OWN_C, 'extras'); // B: home assistance + belongings at no charge
  assert.deepEqual([s.planId, s.reason.type, s.gap], ['B', 'most_extras', 41]);
  assert.equal(suggest(offers(B), B, 'extras').planId, 'C');
  assert.deepEqual(sug(D, 'extras'), ['A', 0]); // building only: no extras, falls back to price
});
test('suggest: only one fit gives "only"; none gives null', () => {
  const only = offers(D).filter((o) => o.plan.id !== 'C');
  assert.equal(suggest(only, D).reason.type, 'only');
  assert.equal(suggest([{ plan: PLANS.B, fits: false }], A), null);
});
test('suggest: prefers the plan whose item limit covers the highest item', () => {
  const big = { ...PLANS.A, limits: { ...PLANS.A.limits, singleItemContents: 60000 } };
  const s = suggest(offers(A, [big, PLANS.C]), A); // item 45,000: only the big plan covers it, despite higher excess
  assert.deepEqual([s.planId, s.reason.type], ['A', 'item_limit']);
});
test('sortOffers: by price or by main-cover excess', () => {
  assert.deepEqual(sortOffers(offers(OWN_C), 'price', OWN_C).map((o) => o.plan.id), ['A', 'B', 'C']);
  assert.deepEqual(sortOffers(offers(OWN_C), 'excess', OWN_C).map((o) => o.plan.id), ['C', 'A', 'B']);
});
test('changedField names the first price answer that changed', () => {
  assert.equal(changedField(A, { ...A, rebuildValue: 3000000 }), 'rebuildValue');
  assert.equal(changedField(A, { ...A, emirate: 'sharjah' }), null);
});

// ---- 12.2 edge paths ----
test('C1 hotel apartment -> help, not eligible, on P1 before any value question', () => {
  const r = eligibility({ role: 'owner_living_in', propertyType: 'hotel_apartment' });
  assert.deepEqual([r.status, r.variant, r.screen], ['ineligible', 'home_type', 'p1']);
});
test('C2 claims yes -> referred on P2', () => {
  assert.deepEqual([eligibility({ ...A, claims5y: true }).status, eligibility({ ...A, claims5y: true }).screen], ['referred', 'p2']);
});
test('C3 to C7 eligibility variants', () => {
  assert.equal(eligibility({ ...D, propertyType: 'shared' }).variant, 'home_type');
  assert.equal(eligibility({ ...A, emptyOver60: true }).variant, 'empty');
  assert.equal(eligibility({ role: 'tenant', tenancy12m: false }).variant, 'tenancy');
  assert.equal(eligibility({ ...A, age18Plus: false }).variant, 'under18');
  assert.deepEqual([eligibility({ ...A, propertyType: 'other' }).status, eligibility({ ...A, propertyType: 'other' }).variant], ['referred', 'home_other']);
});
test('high value is referred: rebuild over 20M, top contents or belongings band', () => {
  assert.equal(eligibility({ ...A, rebuildValue: 20000001 }).variant, 'high_value');
  assert.equal(eligibility({ ...A, rebuildValue: 20000000 }).status, 'ok');
  assert.equal(eligibility({ ...B, contentsBand: 3 }).variant, 'high_value');
  assert.equal(eligibility({ ...A, belongingsBand: 4 }).variant, 'high_value');
});
test('C8 mobile with wrong digit count is invalid; valid formats pass', () => {
  assert.equal(validMobile('0501234567'), true);
  assert.equal(validMobile('+971 50 123 4567'), true);
  assert.equal(validMobile('050123456'), false);
  assert.equal(validMobile('0201234567'), false);
});
test('C9 changing the answer to a valid one clears the block', () => {
  assert.equal(eligibility({ ...A, propertyType: 'shared' }).status, 'ineligible');
  assert.equal(eligibility({ ...A, propertyType: 'apartment' }).status, 'ok');
});
test('eligibility: unanswered questions never trigger; not eligible beats referred', () => {
  assert.equal(eligibility({}).status, 'ok');
  assert.equal(eligibility({ propertyType: 'other', emptyOver60: true }).status, 'ineligible');
});
test('listing note: AED 45,000 item on contents', () => {
  assert.deepEqual(listingNotes(A), ['contents']);
  assert.deepEqual(listingNotes({ ...A, highestItem: 40000 }), []);
});

// ---- data integrity ----
test('cover options respect the role-to-cover map (F1, X14)', () => {
  for (const [role, options] of Object.entries(COVER_OPTIONS))
    for (const opt of options) assert.ok(opt.every((c) => ROLES[role].allowedCovers.includes(c)), `${role}: ${opt}`);
});
test('every fitting plan has a price for every cover option and priced band', () => {
  for (const [role, options] of Object.entries(COVER_OPTIONS))
    for (const covers of options)
      for (const o of offers({ role, covers, rebuildValue: 1000000, contentsBand: 2, belongingsBand: 3 }).filter((x) => x.fits))
        assert.notEqual(o.base, null, `${o.plan.id} ${role} ${covers}`);
});
test('state matrix: which plans fit per role and cover', () => {
  const fitIds = (role, covers) => offers({ role, covers }).filter((o) => o.fits).map((o) => o.plan.id).join('');
  assert.equal(fitIds('owner_living_in', ['building']), 'AC');
  assert.equal(fitIds('owner_living_in', ['contents']), 'ABC');
  assert.equal(fitIds('owner_living_in', ['contents', 'personal_belongings']), 'ABC');
  assert.equal(fitIds('owner_renting_out', ['building']), 'AC');
  assert.equal(fitIds('tenant', ['contents', 'personal_belongings']), 'AC');
  assert.equal(fits(PLANS.B, { role: 'owner_living_in', covers: ['building'] }).reason, 'no_building');
});
