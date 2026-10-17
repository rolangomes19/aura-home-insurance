import test from 'node:test';
import assert from 'node:assert/strict';
import { story, plain } from '../js/story.js';
import { COPY } from '../js/data.js';
import '../js/copy-story.js';

const fmt = (k, v) => (typeof v === 'number' ? `AED ${v.toLocaleString('en-US')}` : COPY.en.values[v] ?? v);
const en = (a) => plain(story(a, COPY.en.story, fmt));
const fieldsOf = (a) => story(a, COPY.en.story, fmt).flat().filter((x) => x.field).map((x) => x.field);

test('story grows one clause at a time as answers arrive', () => {
  assert.equal(en({}), '');
  assert.equal(en({ role: 'owner_renting_out' }), 'I own a home and rent it out.');
  const a = { role: 'owner_renting_out', propertyType: 'apartment', emirate: 'sharjah' };
  assert.equal(en(a), 'I own an apartment in Sharjah and rent it out.');
});

test('story: the full owner-renting-out example from the brief', () => {
  const a = { role: 'owner_renting_out', propertyType: 'apartment', emirate: 'sharjah', age18Plus: true, emptyOver60: false,
    covers: ['building'], claims5y: false, rebuildValue: 300000 };
  assert.equal(en(a), 'I own an apartment in Sharjah and rent it out. I am 18 or over. It never stays empty for over 60 days. ' +
    'I want cover for building. I have raised no insurance claims in the past 5 years. It would cost me AED 300,000 to rebuild it.');
});

test('story: tenant, several covers joined with "and", tenancy clause', () => {
  const a = { role: 'tenant', tenancy12m: true, propertyType: 'villa', covers: ['contents', 'personal_belongings'], highestItem: 8000 };
  assert.match(en(a), /^I rent a villa\. My contract is 12 months or more\./);
  assert.match(en(a), /cover for contents and personal belongings\./);
  assert.match(en(a), /single item is worth AED 8,000\.$/);
});

test('story: every answer a customer can edit has a token (so it can be changed from the pop-up)', () => {
  const a = { role: 'tenant', tenancy12m: true, propertyType: 'villa', emirate: 'dubai', age18Plus: true, emptyOver60: false,
    covers: ['contents', 'personal_belongings'], claims5y: false, contentsValue: 50000, belongingsBand: 1, highestItem: 8000 };
  const f = new Set(fieldsOf(a));
  for (const k of ['role', 'tenancy12m', 'propertyType', 'emirate', 'age18Plus', 'emptyOver60', 'covers', 'claims5y', 'contentsValue', 'belongingsBand', 'highestItem'])
    assert.ok(f.has(k), k);
});

test('story: Arabic templates exist for every clause and every token field has pop-up copy in both languages', () => {
  const a = { role: 'owner_living_in', propertyType: 'apartment', emirate: 'dubai', age18Plus: true, emptyOver60: true,
    covers: ['building', 'contents'], claims5y: true, rebuildValue: 1, contentsValue: 1, belongingsBand: 0, highestItem: 1 };
  for (const lang of ['en', 'ar']) {
    const toks = story(a, COPY[lang].story, fmt).flat().filter((x) => x.field);
    assert.ok(toks.length >= 10, lang);
    for (const x of toks) assert.ok(COPY[lang].story.pop[x.field], `${lang} ${x.field}`);
  }
});
