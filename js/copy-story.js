// Copy for the first-person story panel and its pop-ups. Arabic: needs native review.
import { COPY } from './data.js';
import './copy-plans.js'; // loads copy-flow first, so COPY.ar.values already exists

Object.assign(COPY.ar.values, {
  apartment: 'شقة', villa: 'فيلا', other: 'أخرى',
  abu_dhabi: 'أبوظبي', dubai: 'دبي', sharjah: 'الشارقة', ajman: 'عجمان',
  umm_al_quwain: 'أم القيوين', ras_al_khaimah: 'رأس الخيمة', fujairah: 'الفجيرة',
});

COPY.en.story = {
  change: 'Change this answer',
  sep: ', ', and: ' and ',
  home: {
    owner_living_in: 'I [own|role] {type}{place} and [live in it|role].',
    owner_renting_out: 'I [own|role] {type}{place} and [rent it out|role].',
    tenant: 'I [rent|role] {type}{place}.',
  },
  type: {
    none: 'a home', apartment: 'an [apartment]', villa: 'a [villa]', hotel_apartment: 'a [hotel apartment]',
    shared: '[shared accommodation]', other: 'a [home of another type]',
  },
  place: ' in {x}',
  tenancy: 'My contract is [12 months or more|tenancy12m].',
  age: 'I am [18 or over|age18Plus].',
  empty: {
    true: 'It [stays empty for over 60 days|emptyOver60].',
    false: 'It [never stays empty for over 60 days|emptyOver60].',
  },
  covers: 'I want cover for [{list}|covers].',
  claims: {
    true: 'I [have raised a claim in the past 5 years|claims5y].',
    false: 'I have [raised no insurance claims in the past 5 years|claims5y].',
  },
  rebuild: 'It would cost me [{x}|rebuildValue] to rebuild it.',
  contents: 'My contents are worth about [{x}|contentsValue].',
  belongings: 'My personal belongings are worth [{x}|belongingsBand].',
  item: 'My most expensive single item is worth [{x}|highestItem].',
  pop: {
    role: 'How you are linked to the home decides which covers you can buy.',
    tenancy12m: 'Plans here need a tenancy contract of 12 months or more.',
    propertyType: 'Hotel apartments and shared accommodation are not covered here. A person reviews "other".',
    emirate: 'The emirate where the home is. In Dubai, check who insures the building before you buy building cover.',
    age18Plus: 'The policyholder must be 18 or over.',
    emptyOver60: 'Plans here do not pay for loss while a home is empty 60 days in a row.',
    covers: 'What the plan protects: the structure, the things inside, or items you carry outside.',
    claims5y: 'A past claim means a person reviews your quote before you see a price.',
    rebuildValue: 'What it would cost to build the home again. It is not the price you paid.',
    contentsValue: 'What it would cost to replace everything inside at today\'s prices.',
    belongingsBand: 'The range for items you carry outside the home.',
    highestItem: 'Plans pay up to a set amount for one item. Items above it must be listed by name.',
  },
};

COPY.ar.story = {
  change: 'تعديل هذه الإجابة',
  sep: '، ', and: ' و',
  home: {
    owner_living_in: '[أملك|role] عقارًا{type}{place} [وأسكن فيه|role].',
    owner_renting_out: '[أملك|role] عقارًا{type}{place} [وأؤجره|role].',
    tenant: '[أستأجر|role] عقارًا{type}{place}.',
  },
  type: {
    none: '', apartment: ' من نوع [شقة]', villa: ' من نوع [فيلا]', hotel_apartment: ' من نوع [شقة فندقية]',
    shared: ' من نوع [سكن مشترك]', other: ' من [نوع آخر]',
  },
  place: ' في {x}',
  tenancy: 'مدة عقد الإيجار [12 شهرًا أو أكثر|tenancy12m].',
  age: 'عمري [18 عامًا أو أكثر|age18Plus].',
  empty: {
    true: 'العقار [يبقى خاليًا أكثر من 60 يومًا|emptyOver60].',
    false: 'العقار [لا يبقى خاليًا أكثر من 60 يومًا|emptyOver60].',
  },
  covers: 'أريد تأمين [{list}|covers].',
  claims: {
    true: '[قدّمتُ مطالبة تأمين خلال آخر 5 سنوات|claims5y].',
    false: '[لم أقدّم أي مطالبة تأمين خلال آخر 5 سنوات|claims5y].',
  },
  rebuild: 'ستكلفني إعادة بنائه [{x}|rebuildValue].',
  contents: 'قيمة محتوياته نحو [{x}|contentsValue].',
  belongings: 'قيمة مقتنياتي الشخصية [{x}|belongingsBand].',
  item: 'أغلى قطعة لدي تبلغ قيمتها [{x}|highestItem].',
  pop: {
    role: 'علاقتك بالمنزل تحدد التغطيات التي يمكنك شراؤها.',
    tenancy12m: 'تتطلب الخطط هنا عقد إيجار مدته 12 شهرًا أو أكثر.',
    propertyType: 'لا تُغطّى الشقق الفندقية والسكن المشترك هنا. يراجع شخصٌ نوع «أخرى».',
    emirate: 'الإمارة التي يقع فيها المنزل. في دبي، تحقق ممن يؤمّن المبنى قبل شراء تغطية المبنى.',
    age18Plus: 'يجب أن يكون عمر حامل الوثيقة 18 عامًا أو أكثر.',
    emptyOver60: 'لا تدفع الخطط هنا عن الخسارة أثناء بقاء المنزل خاليًا 60 يومًا متتالية.',
    covers: 'ما تحميه الخطة: المبنى، أو ما بداخله، أو ما تحمله خارج المنزل.',
    claims5y: 'المطالبة السابقة تعني أن يراجع شخصٌ عرضك قبل أن ترى السعر.',
    rebuildValue: 'تكلفة بناء المنزل من جديد. وليست السعر الذي دفعته.',
    contentsValue: 'تكلفة استبدال كل ما بداخل المنزل بأسعار اليوم.',
    belongingsBand: 'النطاق الخاص بالأغراض التي تحملها خارج المنزل.',
    highestItem: 'تدفع الخطط مبلغًا محددًا كحد أقصى للقطعة الواحدة. ما يزيد عليه يجب ذكره بالاسم.',
  },
};
