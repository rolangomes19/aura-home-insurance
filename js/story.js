// First-person account of the answers. Pure: copy `c` and the value formatter `fmt` are passed in.
// Templates mark tokens as [text|field]; a bare [text] takes the field of the slot it is filled into.
// Returns sentences, each a list of {text, field?}. A token's field says which answer it edits.
const tag = (s, field) => s.replace(/\[([^\]|]+)\]/g, `[$1|${field}]`);
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
const parse = (s) => s.split(/(\[[^\]]+\])/).filter(Boolean).map((p) => {
  if (p[0] !== '[') return { text: p };
  const [text, field] = p.slice(1, -1).split('|');
  return { text, field };
});

export function story(a, c, fmt) {
  const out = [];
  const add = (tpl, vars = {}) => out.push(parse(fill(tpl, vars)));
  const has = (k) => a[k] != null && a[k] !== '';

  if (a.role) {
    add(c.home[a.role], {
      type: a.propertyType ? tag(c.type[a.propertyType], 'propertyType') : c.type.none,
      place: a.emirate ? fill(c.place, { x: `[${fmt('emirate', a.emirate)}|emirate]` }) : '',
    });
    if (a.role === 'tenant' && a.tenancy12m === true) add(c.tenancy);
  }
  if (a.age18Plus === true) add(c.age);
  if (typeof a.emptyOver60 === 'boolean') add(c.empty[a.emptyOver60]);
  if (a.covers?.length) {
    const names = a.covers.map((x) => fmt('covers', x).toLowerCase());
    add(c.covers, { list: names.length > 1 ? names.slice(0, -1).join(c.sep) + c.and + names.at(-1) : names[0] });
  }
  if (typeof a.claims5y === 'boolean') add(c.claims[a.claims5y]);
  for (const [field, key] of [['rebuildValue', 'rebuild'], ['contentsValue', 'contents'], ['belongingsBand', 'belongings'], ['highestItem', 'item']])
    if (has(field)) add(c[key], { x: fmt(field, a[field]) });
  return out;
}

export const plain = (sentences) => sentences.map((s) => s.map((x) => x.text).join('')).join(' ');
