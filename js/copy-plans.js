// Copy for S05 and S06 (spec 4, 8). Arabic: needs native review.
import { COPY } from './data.js';
import './copy-flow.js';

Object.assign(COPY.en.values, { home_assistance: 'Home assistance' });
COPY.en.sep = ', ';
COPY.ar.sep = '، ';
Object.assign(COPY.en, {
  s05: {
    h1: 'Plans that fit your answers',
    range: 'We compare plans from [N] insurers. This is not every insurer in the UAE.',
    loading: 'Finding plans that fit your answers',
    suggested: 'Suggested for you',
    sortBy: 'Sort by',
    sorts: { suggested: 'Suggested', price: 'Lowest price', excess: 'Lowest excess' },
    reasonCovers: 'Covers {covers}.',
    reasonEnd: 'You choose.',
    facts: {
      only: 'The only plan that fits your answers.',
      item_limit: 'Its single item limit covers your highest item (AED {x}) without listing.',
      lowest_excess: 'Lowest {main} excess of the plans that fit: AED {n}.',
      lowest_price: 'Lowest illustrative price of the plans that fit.',
    },
    main: { contents: 'contents', belongings: 'belongings' },
    also: 'Also includes: {x}',
    sample: 'Sample plan for layout, not from an insurer',
    noFit: {
      no_building: 'Does not fit: this plan does not cover the building.',
      role: 'Does not fit: this plan is for owners who live in the home.',
      cover: 'Does not fit: this plan does not include the cover you chose.',
    },
    details: 'See details', choose: 'Choose this plan',
    rows: {
      covers: 'Covers included', limitContents: 'Single item limit, contents', limitBelongings: 'Single item limit, belongings',
      excessContents: 'Excess, contents', excessBelongings: 'Excess, belongings', assistance: 'Home assistance',
      cooling: 'Cooling-off', cancel: 'Cancellation and refund',
    },
    notStated: 'Not stated', notIncluded: 'Not included',
    coolingText: '{n} working days, written notice, refund if you made no claim',
    assistText: '{n} call-outs a period, up to AED {amt}',
  },
  s06: {
    covered: 'What is covered', limits: 'Limits', excess: 'Excess', notCovered: 'Not covered',
    cancel: 'Cancellation and cooling-off', docs: 'Documents you will need',
    excessTip: 'Excess: the part you pay on each claim. Example: AED 250 on a contents claim with [Insurer A].',
    limitTip: 'Single item limit: the most the plan pays for one item. Example: AED 40,000 for contents.',
    termExcess: 'excess', termLimit: 'single item limit',
    docsOwner: 'Passport or Emirates ID. Title deed or bank letter.',
    docsTenant: 'Passport or Emirates ID. Ejari or rental agreement.',
    overLimit: 'Over the single item limit: an extra {n}% excess.',
    verify: '[verify] Figures to be checked against the source document before final screens.',
  },
});

Object.assign(COPY.ar.values, { building: 'المبنى', contents: 'المحتويات', personal_belongings: 'المقتنيات الشخصية' });
Object.assign(COPY.ar, {
  s05: {
    h1: 'خطط تناسب إجاباتك',
    range: 'نعرض خططًا من [N] شركات تأمين. هذه ليست كل شركات التأمين في الإمارات.',
    loading: 'نبحث عن الخطط المناسبة لإجاباتك',
    sortBy: 'ترتيب حسب',
    sorts: { suggested: 'المقترحة', price: 'الأقل سعرًا', excess: 'الأقل تحمّلًا' },
    main: { contents: 'المحتويات', belongings: 'المقتنيات' },
    sample: 'خطة نموذجية لتجربة التصميم، وليست من شركة تأمين',
    suggested: 'مقترحة لك',
    reasonCovers: 'تغطي {covers}.',
    reasonEnd: 'القرار لك.',
    facts: {
      item_limit: 'حد القطعة الواحدة فيها يغطي أغلى قطعة لديك ({x}) دون الحاجة إلى تسجيلها.',
      only: 'هي الخطة الوحيدة المناسبة لإجاباتك.',
      lowest_excess: 'أقل مبلغ تحمّل في {main} بين الخطط المناسبة: {n} درهمًا.',
      lowest_price: 'أقل سعر توضيحي بين الخطط المناسبة.',
    },
    noFit: {
      no_building: 'لا تناسب إجاباتك: هذه الخطة لا تغطي المبنى.',
      role: 'لا تناسب إجاباتك: هذه الخطة للمالك الذي يسكن في المنزل.',
    },
    details: 'عرض التفاصيل', choose: 'اختر هذه الخطة',
    notStated: 'غير مذكور', notIncluded: 'غير مشمولة',
    rows: {
      covers: 'التغطيات المشمولة', assistance: 'المساعدة المنزلية',
      limitContents: 'حد القطعة الواحدة', limitBelongings: 'حد القطعة الواحدة',
      excessContents: 'مبلغ التحمّل', excessBelongings: 'مبلغ التحمّل', cooling: 'فترة التراجع', cancel: 'الإلغاء والاسترداد',
    },
  },
});
