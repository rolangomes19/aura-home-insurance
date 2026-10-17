// Domain data (feature brief v2, sections 6, 8, 9). Kept apart from copy so tests load no copy.
// Figures marked [verify] must be checked in the source PDF before final screens (R5).
// Plan wording (cancellation, exclusions, add-on limits) lives in copy-plans.js so it can be translated.

export const ROLES = {
  owner_living_in: { id: 'owner_living_in', allowedCovers: ['building', 'contents', 'personal_belongings'], documents: 'owner' },
  owner_renting_out: { id: 'owner_renting_out', allowedCovers: ['building'], documents: 'owner' }, // X14, F1
  tenant: { id: 'tenant', allowedCovers: ['contents', 'personal_belongings'], documents: 'tenant' }, // M5, K7
};

// Cover choices on P2 per role (O2). Owner renting out has one, shown as a fixed line.
export const COVER_OPTIONS = {
  owner_living_in: [
    ['building'],
    ['contents'],
    ['building', 'contents'],
    ['building', 'contents', 'personal_belongings'],
    ['contents', 'personal_belongings'],
  ],
  owner_renting_out: [['building']],
  tenant: [['contents'], ['contents', 'personal_belongings']],
};

export const PROPERTY_TYPES = ['apartment', 'villa', 'hotel_apartment', 'shared', 'other'];
export const EMIRATES = ['abu_dhabi', 'dubai', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah'];
// Value bands in AED (O5); null = open ended. The last band of each is referred (high value).
export const CONTENTS_BANDS = [[1, 50000], [50001, 100000], [100001, 150000], [150001, null]];
export const BELONGINGS_BANDS = [[1, 25000], [25001, 50000], [50001, 100000], [100001, 150000], [150001, null]];
export const MAX_REBUILD = 20000000; // above this goes to a person [Invented]

// Add-on types. All need contents cover (F1). Never pre-ticked (D7).
export const ADDONS = {
  domestic_staff: { perUnit: 'person', maxQty: 5 },
  home_assistance: { perUnit: null },
  cyber: { perUnit: null },
};
export const ADDON_ORDER = ['domestic_staff', 'home_assistance', 'cyber'];
export const ADDON_COVER = 'contents';

// A = KF-E (F1 to F7), B = KF-S (F8 to F11), C = invented sample plan.
// Prices are AED a year incl 5% VAT, all illustrative (6.3, 6.4). Band arrays follow the band order above.
// Contents 1 to 50,000 for A and C is anchored to two InsuranceMarket quotes (K22); the rest is [Invented].
export const PLANS = {
  A: {
    id: 'A', insurer: '[Insurer A]', isInvented: false, source: 'KF-E',
    roles: ['owner_living_in', 'owner_renting_out', 'tenant'],
    covers: ['building', 'contents', 'personal_belongings'],
    alsoIncludes: [],
    limits: { singleItemContents: 40000, singleItemBelongings: 10000 }, // F5 [verify]
    excess: { contents: 250, belongings: 250, portable: 500, overLimitPct: 10 }, // F5 [verify]
    rates: { contents: [289, 340, 410], belongings: [70, 110, 160, 215], buildingPct: 0.05 },
    addons: { domestic_staff: { price: 83 }, home_assistance: { price: 65 } }, // 83: GIG (K12); 65 [Invented]
    hasCooling: false, hasCancel: true, // F7
  },
  B: {
    id: 'B', insurer: '[Insurer B]', isInvented: false, source: 'KF-S',
    roles: ['owner_living_in'], // F8: written for owner living in
    covers: ['contents', 'personal_belongings'], // no building (F8)
    alsoIncludes: ['personal_belongings'], // included when not chosen, no extra charge [Invented rule]
    limits: { singleItemContents: 40000, singleItemBelongings: 10000 }, // F9 [verify]
    excess: { contents: 350, belongings: 500, portable: 500, overLimitPct: 10 }, // F9 [verify]
    rates: { contents: [330, 385, 460], belongings: [85, 130, 185, 245], buildingPct: null },
    addons: { home_assistance: { included: true } }, // F9: 3 call-outs, up to AED 2,100
    hasCooling: true, hasCancel: false, // F11
  },
  C: {
    id: 'C', insurer: '[Insurer C]', isInvented: true, source: 'invented',
    roles: ['owner_living_in', 'owner_renting_out', 'tenant'],
    covers: ['building', 'contents', 'personal_belongings'],
    alsoIncludes: [],
    limits: { singleItemContents: 40000, singleItemBelongings: 10000 },
    excess: { contents: 150, belongings: 200, portable: 500, overLimitPct: 10 },
    rates: { contents: [407, 470, 560], belongings: [100, 150, 210, 270], buildingPct: 0.065 },
    addons: { domestic_staff: { price: 95 }, home_assistance: { included: true }, cyber: { price: 78 } }, // 78: GIG Cyber Comfort (K12)
    hasCooling: true, hasCancel: true,
  },
};
export const PLAN_ORDER = ['A', 'B', 'C'];

// Eligibility rules (section 9). All are placeholders (A5).
// test(answers) is true only when the question is answered AND triggers the outcome.
export const ELIGIBILITY = [
  { id: 'tenancy', screen: 'p1', outcome: 'not_eligible', variant: 'tenancy', test: (a) => a.role === 'tenant' && a.tenancy12m === false },
  { id: 'home_type', screen: 'p1', outcome: 'not_eligible', variant: 'home_type', test: (a) => a.propertyType === 'hotel_apartment' || a.propertyType === 'shared' },
  { id: 'under18', screen: 'p1', outcome: 'not_eligible', variant: 'under18', test: (a) => a.age18Plus === false },
  { id: 'empty', screen: 'p1', outcome: 'not_eligible', variant: 'empty', test: (a) => a.emptyOver60 === true },
  { id: 'home_other', screen: 'p1', outcome: 'referred', variant: 'home_other', test: (a) => a.propertyType === 'other' },
  { id: 'claims', screen: 'p2', outcome: 'referred', variant: 'claims', test: (a) => a.claims5y === true },
  {
    id: 'high_value', screen: 'p2', outcome: 'referred', variant: 'high_value', // [Invented rule]
    test: (a) => a.rebuildValue > MAX_REBUILD || a.contentsBand === CONTENTS_BANDS.length - 1 || a.belongingsBand === BELONGINGS_BANDS.length - 1,
  },
];

// UAE mobile: prefix then 7 digits (K5)
export const MOBILE_PREFIXES = ['50', '52', '54', '55', '56', '58'];
