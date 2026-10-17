// All content lives here and in copy-*.js. Placeholders stay visibly bracketed: [P], [Insurer A].
// Source IDs (F1, M5, ...) refer to feature-update-brief.md v2 and research-index.md.

// route id -> progress step index (4 = Done). Help sits under "Your home".
export const ROUTES = {
  p1: 0, p2: 1, p3: 2, p4: 2, p5: 3, p6: 3, p7: 3, p8: 4, help: 0,
};
// Pages a saved quote can reopen on (P4 resume)
export const RESUMABLE = ['p1', 'p2', 'p3', 'p5', 'p6', 'p7'];

// Arabic exists for P1, P3, Help only (brief 11, A7)
export const AR_SCREENS = ['p1', 'p3', 'help'];

// answer key -> page where it is edited
export const ANSWER_FIELDS = {
  role: 'p1', tenancy12m: 'p1', propertyType: 'p1', age18Plus: 'p1', emptyOver60: 'p1', emirate: 'p1',
  covers: 'p2', rebuildValue: 'p2', contentsBand: 'p2', belongingsBand: 'p2', highestItem: 'p2', claims5y: 'p2',
};

export const COPY = {
  en: {
    tag: 'Prototype, not a real offer',
    skip: 'Skip to content',
    steps: ['Your home', 'Your cover', 'Your plan', 'Buy'],
    done: 'Done',
    resume: 'Return to a saved quote',
    answersTitle: 'Your answers',
    answersEmpty: 'No answers yet.',
    edit: 'Edit',
    back: 'Back',
    yes: 'Yes',
    no: 'No',
    saved: 'Answers saved',
    langNote: 'Arabic is ready for 3 pages in this prototype',
    priceLabel: 'Illustrative price, not a quote',
    perYear: 'a year, incl 5% VAT',
    footer: [
      'Arranged by Aura (licensed broker, CBUAE licence no. [P]). Issued by [Insurer]. You pay [Insurer].',
      'Phone [P]. Email [P]. <a href="#">Check our licence [P]</a>.',
      'Complaints: contact the insurer first. If not solved in 15 days, contact Sanadak.',
    ],
    labels: {
      role: 'Home link', tenancy12m: 'Tenancy 12 months or more', propertyType: 'Home type', emirate: 'Emirate',
      age18Plus: '18 or over', emptyOver60: 'Empty over 60 days', covers: 'Cover', claims5y: 'Claims in 5 years',
      rebuildValue: 'Rebuild value', contentsBand: 'Contents value', belongingsBand: 'Personal belongings value',
      highestItem: 'Most expensive single item',
    },
    values: {
      owner_living_in: 'Own it, live in it', owner_renting_out: 'Own it, rent it out', tenant: 'Rent it',
      apartment: 'Apartment', villa: 'Villa', hotel_apartment: 'Hotel apartment',
      shared: 'Shared accommodation', other: 'Other',
      building: 'Building', contents: 'Contents', personal_belongings: 'Personal belongings',
    },
  },
  ar: {
    tag: 'نموذج أولي، وليس عرضًا حقيقيًا',
    skip: 'انتقل إلى المحتوى',
    steps: ['منزلك', 'تغطيتك', 'خطتك', 'الشراء'],
    done: 'تم',
    resume: 'العودة إلى عرض محفوظ',
    answersTitle: 'إجاباتك',
    answersEmpty: 'لا توجد إجابات بعد.',
    edit: 'تعديل',
    back: 'رجوع',
    yes: 'نعم',
    no: 'لا',
    saved: 'تم حفظ إجاباتك',
    langNote: 'العربية جاهزة لثلاث صفحات في هذا النموذج',
    priceLabel: 'سعر توضيحي، وليس عرض سعر',
    perYear: 'سنويًا، شاملة ضريبة القيمة المضافة 5%',
    footer: [
      'يرتّبها Aura (وسيط مرخّص، رقم الترخيص [P]). تصدرها [شركة التأمين]. تدفع إلى [شركة التأمين].',
      'الهاتف [P]. البريد الإلكتروني [P]. <a href="#">تحقق من ترخيصنا [P]</a>.',
      'الشكاوى: تواصل مع شركة التأمين أولًا. إذا لم تُحل خلال 15 يومًا، تواصل مع «سندك».',
    ],
  },
};
