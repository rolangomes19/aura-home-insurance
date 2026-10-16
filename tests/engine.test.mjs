import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibility, fits, offers, suggest, total, listingNotes, validMobile, sortOffers } from '../js/engine.js';
import { PLANS, COVER_OPTIONS, ROLES, PRICES } from '../js/domain.js';

const A = { // persona A (6.1)
  role: 'owner_living_in', propertyType: 'villa', emirate: 'dubai', age18Plus: true, emptyOver60: false,
  covers: ['building', 'contents', 'personal_belongings'], claims5y: false, highestItem: 45000,
};
const B = { // persona B (6.2)
  role: 'tenant', tenancy12m: true, propertyType: 'apartment', emirate: 'abu_dhabi', age18Plus: true,
  emptyOver60: false, covers: ['contents'], claims5y: false, highestItem: 8000,
};
const D = { // persona D (6.3)
  role: 'owner_renting_out', propertyType: 'apartment', emirate: 'dubai', age18Plus: true,
  emptyOver60: false, covers: ['building'], claims5y: false,
};
const byId = (list) => Object.fromEntries(list.map((o) => [o.plan.id, o]));

test('persona A: eligible, B does not fit (no building), A suggested at 1450', () => {
  assert.equal(eligibility(A).status, 'ok');
  const o = byId(offers(A));
  assert.equal(o.A.fits, true);
  assert.deepEqual([o.B.fits, o.B.reason], [false, 'no_building']);
  assert.equal(o.C.fits, true);
  assert.equal(o.A.price, 1450);
  assert.equal(o.C.price, 1620);
  const s = suggest(offers(A), A);
  assert.equal(s.planId, 'A');
  assert.equal(s.reason.type, 'lowest_excess');
  assert.equal(s.reason.excess, 250);
});

test('persona A: item AED 45,000 triggers the listing note', () => {
  assert.deepEqual(listingNotes(A), ['contents']);
  assert.deepEqual(listingNotes({ ...A, highestItem: 40000 }), []);
});

test('persona B: tenant, B does not fit (role), A suggested at 290', () => {
  assert.equal(eligibility(B).status, 'ok');
  const o = byId(offers(B));
  assert.deepEqual([o.B.fits, o.B.reason], [false, 'role']);
  assert.equal(o.A.price, 290);
  assert.equal(o.C.price, 315);
  assert.equal(suggest(offers(B), B).planId, 'A');
});

test('persona D: owner renting out, building only, A 950, B does not fit (role)', () => {
  assert.equal(eligibility(D).status, 'ok');
  const o = byId(offers(D));
  assert.equal(o.A.price, 950);
  assert.deepEqual([o.B.fits, o.B.reason], [false, 'role']);
  const s = suggest(offers(D), D);
  assert.deepEqual([s.planId, s.reason.type], ['A', 'lowest_price']);
});

test('owner living in, contents + belongings: B fits and prices match 5.5', () => {
  const a = { ...A, covers: ['contents', 'personal_belongings'] };
  const o = byId(offers(a));
  assert.deepEqual([o.A.price, o.B.price, o.C.price], [520, 560, 600]);
  assert.ok(o.B.fits);
  assert.equal(suggest(offers(a), a).planId, 'A');
});

test('suggest: only one fit gives "only"; none gives null', () => {
  const only = offers({ ...A, covers: ['building'] }).filter((o) => o.plan.id !== 'C');
  assert.equal(suggest(only, { ...A, covers: ['building'] }).reason.type, 'only');
  assert.equal(suggest([{ plan: PLANS.B, fits: false }], A), null);
});

test('suggest: prefers the plan whose item limit covers the highest item', () => {
  const big = { ...PLANS.C, limits: { ...PLANS.C.limits, singleItemContents: 60000 } };
  const list = offers(A, [PLANS.A, big]);
  const s = suggest(list, A); // item 45,000: only the big plan covers it, despite higher excess
  assert.deepEqual([s.planId, s.reason.type], ['C', 'item_limit']);
});

test('suggest never ranks by price alone over a lower excess', () => {
  const list = offers({ ...B, covers: ['contents'] });
  assert.equal(suggest(list, B).reason.type, 'lowest_excess');
});

test('total: domestic staff add-on only on plan A, never added unless asked', () => {
  assert.equal(total(PLANS.A, A), 1450);
  assert.equal(total(PLANS.A, A, ['domestic_staff']), 1533);
  assert.equal(total(PLANS.C, A, ['domestic_staff']), 1620);
});

test('sortOffers: fitting plans first, then lowest price', () => {
  const sorted = sortOffers(offers({ ...A, covers: ['contents', 'personal_belongings'] }), 'price');
  assert.deepEqual(sorted.map((o) => o.plan.id), ['A', 'B', 'C']);
  assert.equal(sortOffers(offers(A), 'price').at(-1).plan.id, 'B');
});

// Persona C: edge cases (6.4)
test('C1 hotel apartment -> E1 home_type, before any value question', () => {
  const r = eligibility({ ...A, propertyType: 'hotel_apartment', covers: undefined, highestItem: undefined });
  assert.deepEqual([r.route, r.variant, r.screen], ['e1', 'home_type', 's02']);
});
test('C2 claims yes -> E2 claims', () => {
  const r = eligibility({ ...A, claims5y: true });
  assert.deepEqual([r.route, r.variant, r.screen], ['e2', 'claims', 's03']);
});
test('C3 shared accommodation -> E1 home_type (owner renting out too)', () => {
  assert.equal(eligibility({ ...A, propertyType: 'shared' }).route, 'e1');
  assert.equal(eligibility({ ...D, propertyType: 'shared' }).variant, 'home_type');
});
test('C4 empty over 60 days -> E1 empty', () => {
  assert.equal(eligibility({ ...A, emptyOver60: true }).variant, 'empty');
});
test('C5 tenancy under 12 months -> E1 tenancy at S01', () => {
  const r = eligibility({ role: 'tenant', tenancy12m: false });
  assert.deepEqual([r.route, r.variant, r.screen], ['e1', 'tenancy', 's01']);
});
test('C6 under 18 -> E1 under18', () => {
  assert.equal(eligibility({ ...A, age18Plus: false }).variant, 'under18');
});
test('C7 home type Other -> E2 home_other', () => {
  const r = eligibility({ ...A, propertyType: 'other' });
  assert.deepEqual([r.route, r.variant], ['e2', 'home_other']);
});
test('C8 mobile with wrong digit count is invalid; valid formats pass', () => {
  assert.equal(validMobile('0501234567'), true);
  assert.equal(validMobile('+971 50 123 4567'), true);
  assert.equal(validMobile('050123456'), false);
  assert.equal(validMobile('05012345678'), false);
  assert.equal(validMobile('0201234567'), false);
});
test('C9 changing the answer to a valid one clears the block, answers kept', () => {
  const bad = { ...A, propertyType: 'shared' };
  assert.equal(eligibility(bad).status, 'ineligible');
  const fixed = { ...bad, propertyType: 'apartment' };
  assert.equal(eligibility(fixed).status, 'ok');
  assert.equal(fixed.role, A.role);
});

test('eligibility: unanswered questions never trigger; not eligible beats referred', () => {
  assert.equal(eligibility({}).status, 'ok');
  assert.equal(eligibility({ propertyType: 'other', emptyOver60: true }).route, 'e1');
});

test('cover options respect the role-to-cover map (F1, X14, K7)', () => {
  for (const [role, options] of Object.entries(COVER_OPTIONS))
    for (const opt of options) assert.ok(opt.every((c) => ROLES[role].allowedCovers.includes(c)), `${role}: ${opt}`);
  assert.equal(COVER_OPTIONS.owner_living_in.length, 5);
});

test('every fitting plan has a price for every offered cover option (no blank cards)', () => {
  for (const [role, options] of Object.entries(COVER_OPTIONS))
    for (const covers of options)
      for (const o of offers({ role, covers }).filter((x) => x.fits))
        assert.notEqual(o.price, null, `${o.plan.id} ${role} ${covers}`);
  assert.ok(PRICES.A['tenant|contents'] === 290);
});

test('state matrix: which plans fit per role and cover (section 3)', () => {
  const fitIds = (role, covers) => offers({ role, covers }).filter((o) => o.fits).map((o) => o.plan.id).join('');
  assert.equal(fitIds('owner_living_in', ['building']), 'AC');
  assert.equal(fitIds('owner_living_in', ['contents']), 'ABC');
  assert.equal(fitIds('owner_living_in', ['building', 'contents']), 'AC');
  assert.equal(fitIds('owner_living_in', ['contents', 'personal_belongings']), 'ABC');
  assert.equal(fitIds('owner_renting_out', ['building']), 'AC');
  assert.equal(fitIds('tenant', ['contents']), 'AC');
  assert.equal(fitIds('tenant', ['contents', 'personal_belongings']), 'AC');
});

test('fits: plan B for building reports no_building, cover reason otherwise', () => {
  assert.equal(fits(PLANS.B, { role: 'owner_living_in', covers: ['building'] }).reason, 'no_building');
  assert.equal(fits(PLANS.B, { role: 'tenant', covers: ['contents'] }).reason, 'role');
});
