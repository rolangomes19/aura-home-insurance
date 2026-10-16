// Domain data (spec sections 2, 5.1 to 5.7, 10.3). Kept apart from data.js (UI copy) so tests load no copy.
// Figures marked [verify] must be checked in the source PDF before final screens (R5).

export const COVERS = {
  building: { id: 'building', optional: false },
  contents: { id: 'contents', optional: false },
  personal_belongings: { id: 'personal_belongings', optional: false },
  domestic_staff: { id: 'domestic_staff', optional: true }, // off by default (D7)
  home_assistance: { id: 'home_assistance', optional: false }, // Insurer B only
};

export const ROLES = {
  owner_living_in: { id: 'owner_living_in', allowedCovers: ['building', 'contents', 'personal_belongings'], extraQuestions: [], documents: 'owner' },
  owner_renting_out: { id: 'owner_renting_out', allowedCovers: ['building'], extraQuestions: [], documents: 'owner' }, // X14, F1
  tenant: { id: 'tenant', allowedCovers: ['contents', 'personal_belongings'], extraQuestions: ['tenancy12m'], documents: 'tenant' }, // M5, K7
};

// Cover choices offered on S03 per role (O2, state matrix). Options a role cannot have are hidden.
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
// Belongings value bands in AED (O5); null = open ended
export const BELONGINGS_BANDS = [[1, 25000], [25001, 50000], [50001, 100000], [100001, 150000], [150001, null]];

// A = KF-E (F1 to F7), B = KF-S (F8 to F11), C = placeholder layout plan (5.1).
// null = "not stated" in the source. Plan C values are all [P] and [Invented] so layout and the suggestion rule can run.
export const PLANS = {
  A: {
    id: 'A', name: '[Insurer A]', source: 'KF-E', placeholder: false,
    roles: ['owner_living_in', 'owner_renting_out', 'tenant'],
    covers: ['building', 'contents', 'personal_belongings'],
    addons: ['domestic_staff'],
    limits: { singleItemContents: 40000, singleItemBelongings: 10000, proofContents: 20000, proofBelongings: 5000 }, // F5
    excess: { contents: 250, belongings: 250, portable: 500, overLimitPct: 10 }, // F5
    cancellation: '7 days written notice, pro-rata refund', // F7
    coolingOffDays: null, // not stated (F7)
  },
  B: {
    id: 'B', name: '[Insurer B]', source: 'KF-S', placeholder: false,
    roles: ['owner_living_in'], // F8: written for owner living in
    covers: ['contents', 'personal_belongings', 'home_assistance'], // no building (F8)
    addons: [],
    limits: { singleItemContents: 40000, singleItemBelongings: 10000, proofContents: null, proofBelongings: null }, // F9
    excess: { contents: 350, belongings: 500, portable: 500, overLimitPct: 10 }, // F9
    homeAssistance: { callOuts: 3, upTo: 2100 }, // F9
    cancellation: null,
    coolingOffDays: 15, // working days, written notice, refund if no claim (F11)
  },
  C: {
    id: 'C', name: '[Insurer C]', source: 'none', placeholder: true,
    roles: ['owner_living_in', 'owner_renting_out', 'tenant'], // same as A [P]
    covers: ['building', 'contents', 'personal_belongings'],
    addons: [],
    limits: { singleItemContents: 40000, singleItemBelongings: 10000, proofContents: null, proofBelongings: null },
    excess: { contents: 300, belongings: 300, portable: null, overLimitPct: 10 },
    cancellation: null,
    coolingOffDays: null,
  },
};
export const PLAN_ORDER = ['A', 'B', 'C'];

// Illustrative prices incl 5% VAT (5.5). Key = role|sorted covers. Only the first tenant row and
// domestic staff have a source (K12, K22); the rest are [Invented].
export const PRICES = {
  A: {
    'tenant|contents': 290,
    'tenant|contents+personal_belongings': 340,
    'owner_living_in|building+contents+personal_belongings': 1450,
    'owner_living_in|contents+personal_belongings': 520,
    'owner_living_in|building': 900,
    'owner_living_in|contents': 380,
    'owner_living_in|building+contents': 1250,
    'owner_renting_out|building': 950,
  },
  B: {
    'owner_living_in|contents+personal_belongings': 560,
    'owner_living_in|contents': 410,
  },
  C: {
    'tenant|contents': 315,
    'tenant|contents+personal_belongings': 370,
    'owner_living_in|building+contents+personal_belongings': 1620,
    'owner_living_in|contents+personal_belongings': 600,
    'owner_living_in|building': 1020,
    'owner_living_in|contents': 430,
    'owner_living_in|building+contents': 1400,
    'owner_renting_out|building': 1080,
  },
};
export const ADDON_PRICES = { domestic_staff: 83 }; // GIG domestic helper add-on (K12), illustrative only

// Eligibility rules (10.3). All are placeholders modelled on M5, M6, F1, K6.
// test(answers) is true only when the question is answered AND triggers the outcome.
export const ELIGIBILITY = [
  { id: 'tenancy', screen: 's01', outcome: 'not_eligible', variant: 'tenancy', test: (a) => a.role === 'tenant' && a.tenancy12m === false },
  { id: 'under18', screen: 's02', outcome: 'not_eligible', variant: 'under18', test: (a) => a.age18Plus === false },
  { id: 'home_type', screen: 's02', outcome: 'not_eligible', variant: 'home_type', test: (a) => a.propertyType === 'hotel_apartment' || a.propertyType === 'shared' },
  { id: 'empty', screen: 's02', outcome: 'not_eligible', variant: 'empty', test: (a) => a.emptyOver60 === true },
  { id: 'home_other', screen: 's02', outcome: 'referred', variant: 'home_other', test: (a) => a.propertyType === 'other' },
  { id: 'claims', screen: 's03', outcome: 'referred', variant: 'claims', test: (a) => a.claims5y === true },
];

// UAE mobile: prefix then 7 digits (K5)
export const MOBILE_PREFIXES = ['50', '52', '54', '55', '56', '58'];
