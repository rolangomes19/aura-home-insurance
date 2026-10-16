// All content lives here. Placeholders stay visibly bracketed: [P], [Insurer A].
// Source IDs (F1, M5, ...) refer to prototype-spec.md.

export const STEPS = ['home', 'cover', 'plan', 'buy'];

// route id -> progress step index
export const ROUTES = {
  s01: 0, s02: 0, s03: 1, s04: 1, s05: 2, s06: 2,
  s07: 3, s08: 3, s09: 3, s10: 3, s11: 3, s12: 3, s13: 3, s14: 3,
  e1: 0, e2: 0,
};

// Arabic exists for S01, S05, E1 only (spec section 8)
export const AR_SCREENS = ['s01', 's05', 'e1'];

// answer key -> screen where it is edited
export const ANSWER_FIELDS = {
  role: 's01', tenancy12m: 's01', propertyType: 's02', emirate: 's02', age18Plus: 's02',
  emptyOver60: 's02', covers: 's03', claims5y: 's03', rebuildValue: 's04', contentsValue: 's04',
  belongingsBand: 's04', highestItem: 's04',
};

export const COPY = {
  en: {
    tag: 'Prototype, not a real offer',
    steps: ['Your home', 'Your cover', 'Your plan', 'Buy'],
    answersTitle: 'Your answers',
    answersEmpty: 'No answers yet.',
    edit: 'Edit',
    back: 'Back',
    yes: 'Yes',
    no: 'No',
    saved: 'Answers saved',
    langNote: 'Arabic is ready for 3 screens in this prototype',
    priceLabel: 'Illustrative price, not a quote',
    perYear: 'a year, incl 5% VAT',
    footer: [
      'Arranged by [licensed broker], CBUAE licence no. [P]. Issued by [Insurer]. You pay [Insurer].',
      'Phone [P]. Email [P]. Check our licence [P].',
      'Complaints: contact the insurer first. If not solved in 15 days, contact Sanadak.',
    ],
    labels: {
      role: 'Home link', tenancy12m: 'Tenancy 12 months or more', propertyType: 'Home type', emirate: 'Emirate',
      age18Plus: '18 or over', emptyOver60: 'Empty over 60 days', covers: 'Cover', claims5y: 'Claims in 5 years',
      rebuildValue: 'Rebuild value', contentsValue: 'Contents value', belongingsBand: 'Belongings value',
      highestItem: 'Highest single item',
    },
    values: {
      owner_living_in: 'Own it, live in it', owner_renting_out: 'Own it, rent it out', tenant: 'Rent it',
      apartment: 'Apartment', villa: 'Villa', hotel_apartment: 'Hotel apartment',
      shared: 'Shared accommodation', other: 'Other',
      building: 'Building', contents: 'Contents', personal_belongings: 'Personal belongings',
    },
    placeholderScreen: 'This screen is built in a later phase.',
  },
  ar: {
    tag: 'نموذج أولي، وليس عرضًا حقيقيًا',
    steps: ['منزلك', 'تغطيتك', 'خطتك', 'الشراء'],
    answersTitle: 'إجاباتك',
    answersEmpty: 'لا توجد إجابات بعد.',
    edit: 'تعديل',
    back: 'رجوع',
    yes: 'نعم',
    no: 'لا',
    saved: 'تم حفظ إجاباتك',
    langNote: 'العربية جاهزة لثلاث شاشات في هذا النموذج',
    priceLabel: 'سعر توضيحي، وليس عرض سعر',
    perYear: 'سنويًا، شاملة ضريبة القيمة المضافة 5%',
    footer: [
      'يرتّبها [وسيط مرخّص]. تصدرها [شركة التأمين]. تدفع إلى [شركة التأمين].',
    ],
  },
};
