// Copy for P3 plans and price, plan wording and add-ons (brief 5.4, 6.2, 6.4, 11.2).
// Arabic: brief strings plus drafts for the gaps. All Arabic needs native review.
import { COPY } from './data.js';
import './copy-flow.js';

Object.assign(COPY.en.values, { home_assistance: 'Home assistance', domestic_staff: 'Domestic staff', cyber: 'Cyber cover' });
COPY.en.sep = ', ';
COPY.ar.sep = '، ';

Object.assign(COPY.en, {
  p3: {
    h1: 'Plans that fit your answers',
    range: 'We compare plans from [N] insurers. This is not every insurer in the UAE.',
    loading: 'Finding plans that fit your answers',
    suggested: 'Suggested for you',
    priority: { label: 'What matters most to you?', excess: 'Lower excess', price: 'Lower price', extras: 'Extras included' },
    sortBy: 'Sort other plans by',
    sorts: { suggested: 'Suggested', price: 'Lowest price', excess: 'Lowest excess' },
    reasonCovers: 'Covers {covers}.',
    facts: {
      only: 'The only plan that fits your answers.',
      item_limit: 'Its single item limit covers your most expensive item without listing.',
      lowest_excess: 'Lowest {main} excess of the plans that fit: AED {n}.',
      lowest_price: 'Lowest price of the plans that fit.',
      most_extras: 'Most extras at no extra charge of the plans that fit.',
    },
    gap: 'AED {d} more a year than the lowest-price plan.',
    reasonEnd: 'You choose.',
    main: { contents: 'contents', belongings: 'belongings' },
    insurer: 'Insurer: {x}',
    coversIncluded: 'Covers: {x}',
    also: 'Also includes: {x}',
    sample: 'Sample plan. Terms are invented for this prototype.',
    otherHeading: 'Other plans that fit',
    noFitHeading: 'Plans that do not fit',
    noFit: {
      no_building: 'Does not fit: this plan does not cover the building.',
      role: 'Does not fit: this plan is for owners who live in the home.',
      cover: 'Does not fit: this plan does not include the cover you chose.',
    },
    details: 'See details', showDetails: 'Show details', hideDetails: 'Hide details', choose: 'Choose this plan',
    compare: 'Show full comparison', hideCompare: 'Hide full comparison', continue: 'Continue with {plan}',
    rows: {
      covers: 'Covers included', limitContents: 'Single item limit, contents', limitBelongings: 'Single item limit, belongings',
      limits: 'Single item limits', excessContents: 'Excess, contents', excessBelongings: 'Excess, belongings',
      assistance: 'Home assistance', cooling: 'Cooling-off', cancel: 'Cancellation and refund',
    },
    limitsText: '{c} contents, {b} belongings',
    notStated: 'Not stated', included: 'Included', paid: 'Paid add-on', notOffered: 'Not offered',
    addonsTitle: 'Optional add-ons',
    noAddons: 'This plan has no optional add-ons.',
    buildingOnly: 'No optional add-ons for building-only cover.',
    includedLine: 'Included in this plan',
    totalWould: 'Total would be {x}',
    perPerson: 'per person',
    staffQty: 'Number of domestic staff (1 to 5)',
    noteIncluded: '{x} included',
    noteNone: '{x} not offered',
    removed: '{x} is not offered by {plan}. It was removed.',
    baseChanged: 'Base changed from {x} to {y} because you changed {answer}.',
    noLongerFits: 'Your plan {plan} no longer fits your answers. Choose a plan.',
    panel: { title: 'Your price', base: 'Base', addons: 'Add-ons', none: 'None', total: 'Total now' },
  },
  drawer: {
    covered: 'What is covered', limits: 'Limits', excess: 'Excess', notCovered: 'Not covered',
    cancel: 'Cancellation and cooling-off', docs: 'Documents you will need', close: 'Close',
    excessTip: ['excess', 'The part you pay on each claim. Example: AED 250 on a contents claim with [Insurer A].'],
    limitTip: ['single item limit', 'The most the plan pays for one item. Example: AED 40,000 for contents.'],
    docsOwner: 'Passport or Emirates ID. Title deed or bank letter.',
    docsTenant: 'Passport or Emirates ID. Ejari or rental agreement.',
    portable: 'Portable equipment or valuables: {x}',
    overLimit: 'Over the single item limit: an extra {n}% excess.',
    verify: '[verify] Figures to be checked against the source document before final screens.',
  },
  plans: {
    A: {
      name: 'Standard cover',
      cancel: "Cancel with 7 days' written notice. You get back the unused part of the premium.",
      cooling: null,
      limits: [
        'Glass and sanitary ware: up to 10% of the building sum insured',
        'Rent or alternative accommodation: up to 12 months, max 20% of the building sum insured and AED 500,000',
        "Owner's liability: AED 2,000,000", 'Money: AED 1,000', 'Keys and locks: AED 2,000', 'Contents in the open: AED 2,500',
        'Temporary removal: 20% of the contents sum insured',
        "Tenant's liability: the higher of 20% of the contents sum insured or AED 100,000",
        "Visitors' effects: AED 2,500", 'Legal liability: AED 2,000,000',
        'Proof of value needed: contents items over AED 20,000, belongings over AED 5,000',
      ],
      notCovered: ['Loss not reported to the police', 'Deliberate acts', 'Home empty 60 days in a row', 'Loss before the start date', 'Wear and tear', 'Faulty work', 'Consequential loss'],
    },
    B: {
      name: 'Contents with home assistance',
      cancel: null,
      cooling: 'Cancel within 15 working days in writing. Refund if you made no claim.',
      limits: ['Other limits: not stated'],
      notCovered: ['Home empty over 60 days in a row', 'Loss not reported to the police', 'Mysterious disappearance', 'Wear and tear', 'Consequential loss'],
    },
    C: {
      name: 'Low excess cover',
      cancel: "Cancel with 30 days' written notice. You get back the unused part of the premium.",
      cooling: 'Cancel within 14 days. Refund if you made no claim.',
      // Sub-limits and exclusions: same as Plan A (invented)
    },
  },
  addons: {
    domestic_staff: {
      name: 'Domestic staff',
      desc: 'Cover for your duty as employer of a live-in helper.',
      limits: "Employer's liability up to AED 250,000. Death or permanent disablement AED 30,000. Medical AED 10,000. Repatriation AED 10,000.",
    },
    home_assistance: {
      name: 'Home assistance',
      desc: 'A plumber, electrician or locksmith when something breaks.',
      limits: '3 call-outs a period, up to AED 2,100.',
    },
    cyber: {
      name: 'Cyber cover',
      desc: 'Cover for online fraud and misuse of your identity.',
      limits: 'Limit AED 10,000.',
    },
  },
});
COPY.en.plans.C.limits = COPY.en.plans.A.limits;
COPY.en.plans.C.notCovered = COPY.en.plans.A.notCovered;

Object.assign(COPY.ar.values, { building: 'المبنى', contents: 'المحتويات', personal_belongings: 'المقتنيات الشخصية', home_assistance: 'المساعدة المنزلية', domestic_staff: 'العمالة المنزلية', cyber: 'التغطية الإلكترونية' });
Object.assign(COPY.ar, {
  p3: {
    h1: 'خطط تناسب إجاباتك',
    range: 'نقارن خططًا من [N] شركات تأمين. هذه ليست كل شركات التأمين في الإمارات.',
    loading: 'نبحث عن الخطط المناسبة لإجاباتك',
    suggested: 'مقترحة لك',
    priority: { label: 'ما الأهم بالنسبة لك؟', excess: 'مبلغ تحمّل أقل', price: 'سعر أقل', extras: 'مزايا مشمولة' },
    sortBy: 'ترتيب الخطط الأخرى حسب',
    sorts: { suggested: 'المقترحة', price: 'الأقل سعرًا', excess: 'الأقل تحمّلًا' },
    reasonCovers: 'تغطي {covers}.',
    facts: {
      only: 'هي الخطة الوحيدة المناسبة لإجاباتك.',
      item_limit: 'حد القطعة الواحدة فيها يغطي أغلى قطعة لديك دون الحاجة إلى تسجيلها.',
      lowest_excess: 'أقل مبلغ تحمّل في {main} بين الخطط المناسبة: {n} درهمًا.',
      lowest_price: 'أقل سعر بين الخطط المناسبة.',
      most_extras: 'أكثر المزايا المشمولة دون تكلفة إضافية بين الخطط المناسبة.',
    },
    gap: 'أعلى بمبلغ {d} درهم سنويًا من الخطة الأقل سعرًا.',
    reasonEnd: 'القرار لك.',
    main: { contents: 'المحتويات', belongings: 'المقتنيات' },
    insurer: 'شركة التأمين: {x}',
    coversIncluded: 'التغطية: {x}',
    also: 'تشمل أيضًا: {x}',
    sample: 'خطة نموذجية. الشروط مُختلقة لهذا النموذج.',
    otherHeading: 'خطط أخرى مناسبة لك',
    noFitHeading: 'خطط لا تناسب إجاباتك',
    noFit: {
      no_building: 'لا تناسب إجاباتك: هذه الخطة لا تغطي المبنى.',
      role: 'لا تناسب إجاباتك: هذه الخطة للمالك الذي يسكن في المنزل.',
      cover: 'لا تناسب إجاباتك: هذه الخطة لا تشمل التغطية التي اخترتها.',
    },
    details: 'عرض التفاصيل', showDetails: 'عرض التفاصيل', hideDetails: 'إخفاء التفاصيل', choose: 'اختر هذه الخطة',
    compare: 'عرض المقارنة الكاملة', hideCompare: 'إخفاء المقارنة الكاملة', continue: 'المتابعة مع {plan}',
    rows: {
      covers: 'التغطيات المشمولة', limitContents: 'حد القطعة الواحدة، المحتويات', limitBelongings: 'حد القطعة الواحدة، المقتنيات',
      limits: 'حد القطعة الواحدة', excessContents: 'مبلغ التحمّل، المحتويات', excessBelongings: 'مبلغ التحمّل، المقتنيات',
      assistance: 'المساعدة المنزلية', cooling: 'فترة التراجع', cancel: 'الإلغاء والاسترداد',
    },
    limitsText: '{c} للمحتويات، {b} للمقتنيات',
    notStated: 'غير مذكور', included: 'مشمولة', paid: 'إضافة مدفوعة', notOffered: 'غير متاحة',
    addonsTitle: 'إضافات اختيارية',
    noAddons: 'لا توجد إضافات اختيارية في هذه الخطة.',
    buildingOnly: 'لا توجد إضافات اختيارية لتغطية المبنى فقط.',
    includedLine: 'مشمولة في هذه الخطة',
    totalWould: 'سيصبح الإجمالي {x}',
    perPerson: 'لكل شخص',
    staffQty: 'عدد العمالة المنزلية (من 1 إلى 5)',
    noteIncluded: '{x} مشمولة',
    noteNone: '{x} غير متاحة',
    removed: '{x} غير متاحة في {plan}. تمت إزالتها.',
    baseChanged: 'تغيّر السعر الأساسي من {x} إلى {y} لأنك غيّرت {answer}.',
    noLongerFits: 'خطتك {plan} لم تعد تناسب إجاباتك. اختر خطة.',
    panel: { title: 'سعرك', base: 'السعر الأساسي', addons: 'الإضافات', none: 'لا يوجد', total: 'الإجمالي الآن' },
  },
  drawer: {
    covered: 'ما الذي تغطيه', limits: 'الحدود', excess: 'مبلغ التحمّل', notCovered: 'ما لا تغطيه',
    cancel: 'الإلغاء وفترة التراجع', docs: 'المستندات المطلوبة', close: 'إغلاق',
    excessTip: ['مبلغ التحمّل', 'الجزء الذي تدفعه في كل مطالبة. مثال: 250 درهمًا في مطالبة محتويات مع [Insurer A].'],
    limitTip: ['حد القطعة الواحدة', 'أقصى ما تدفعه الخطة عن قطعة واحدة. مثال: 40,000 درهم للمحتويات.'],
    docsOwner: 'جواز السفر أو الهوية الإماراتية. سند الملكية أو خطاب من البنك.',
    docsTenant: 'جواز السفر أو الهوية الإماراتية. عقد إيجاري أو عقد الإيجار.',
    portable: 'الأجهزة المحمولة أو المقتنيات الثمينة: {x}',
    overLimit: 'فوق حد القطعة الواحدة: مبلغ تحمّل إضافي بنسبة {n}%.',
    verify: '[verify] يجب التحقق من الأرقام في المستند المصدر قبل الشاشات النهائية.',
  },
  plans: {
    A: {
      name: 'التغطية القياسية',
      cancel: 'الإلغاء بإشعار كتابي قبل 7 أيام. تسترد الجزء غير المستخدم من القسط.',
      cooling: null,
      limits: [
        'الزجاج والأدوات الصحية: حتى 10% من مبلغ تأمين المبنى',
        'الإيجار أو السكن البديل: حتى 12 شهرًا، بحد أقصى 20% من مبلغ تأمين المبنى و500,000 درهم',
        'مسؤولية المالك: 2,000,000 درهم', 'النقود: 1,000 درهم', 'المفاتيح والأقفال: 2,000 درهم', 'المحتويات في الهواء الطلق: 2,500 درهم',
        'النقل المؤقت: 20% من مبلغ تأمين المحتويات',
        'مسؤولية المستأجر: 20% من مبلغ تأمين المحتويات أو 100,000 درهم، أيهما أعلى',
        'مقتنيات الزوار: 2,500 درهم', 'المسؤولية القانونية: 2,000,000 درهم',
        'يلزم إثبات القيمة: قطع المحتويات فوق 20,000 درهم، والمقتنيات فوق 5,000 درهم',
      ],
      notCovered: ['الخسارة غير المبلّغ عنها للشرطة', 'الأفعال المتعمدة', 'بقاء المنزل خاليًا 60 يومًا متتالية', 'الخسارة قبل تاريخ البدء', 'البلى والاستهلاك', 'العمل المعيب', 'الخسارة التبعية'],
    },
    B: {
      name: 'المحتويات مع المساعدة المنزلية',
      cancel: null,
      cooling: 'الإلغاء كتابيًا خلال 15 يوم عمل. تسترد المبلغ إذا لم تقدّم مطالبة.',
      limits: ['الحدود الأخرى: غير مذكورة'],
      notCovered: ['بقاء المنزل خاليًا أكثر من 60 يومًا متتالية', 'الخسارة غير المبلّغ عنها للشرطة', 'الاختفاء الغامض', 'البلى والاستهلاك', 'الخسارة التبعية'],
    },
    C: {
      name: 'تغطية بمبلغ تحمّل منخفض',
      cancel: 'الإلغاء بإشعار كتابي قبل 30 يومًا. تسترد الجزء غير المستخدم من القسط.',
      cooling: 'الإلغاء خلال 14 يومًا. تسترد المبلغ إذا لم تقدّم مطالبة.',
    },
  },
  addons: {
    domestic_staff: {
      name: 'العمالة المنزلية',
      desc: 'تغطية مسؤوليتك كصاحب عمل لعامل منزلي مقيم.',
      limits: 'مسؤولية صاحب العمل حتى 250,000 درهم. الوفاة أو العجز الدائم 30,000 درهم. العلاج 10,000 درهم. الإعادة إلى الوطن 10,000 درهم.',
    },
    home_assistance: {
      name: 'المساعدة المنزلية',
      desc: 'سبّاك أو كهربائي أو فنّي أقفال عند حدوث عطل.',
      limits: '3 زيارات في الفترة، حتى 2,100 درهم.',
    },
    cyber: {
      name: 'التغطية الإلكترونية',
      desc: 'تغطية الاحتيال عبر الإنترنت وإساءة استخدام هويتك.',
      limits: 'الحد 10,000 درهم.',
    },
  },
});
COPY.ar.plans.C.limits = COPY.ar.plans.A.limits;
COPY.ar.plans.C.notCovered = COPY.ar.plans.A.notCovered;
