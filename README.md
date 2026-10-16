# Aura home insurance: lo-fi prototype

Click-through prototype of a UAE home-insurance marketplace (assignment premise). Responsive at 390, 768 and 1280 px. English throughout; Arabic (right-to-left) on S01, S05 and E1 only. Built from `prototype-spec.md` v1.

**Prototype, not a real offer.** All insurers, prices, IDs and payments are fake.

## Run

Vanilla HTML/CSS/JS, no build step. ES modules need a web server (not `file://`):

```bash
python -m http.server 8123
```

Open http://localhost:8123. Tests (engine only):

```bash
node --test tests/engine.test.mjs
```

## Layout

| Path | Role |
| --- | --- |
| `js/domain.js` | Roles, covers, plans A/B/C, limits, excess, prices, eligibility rules |
| `js/engine.js` | Pure functions: `eligibility`, `fits`, `suggest`, `total`, `listingNotes`, `validMobile` |
| `js/data.js`, `copy-*.js` | All copy (EN, partial AR). No copy in renderers |
| `js/app.js` | Router, state (localStorage), `price()` helper, term tips |
| `js/screens.js`, `plans.js`, `buy.js` | S01-S04 + E1/E2, S05-S06, S07-S14 |

## What is placeholder

- Insurer names, broker, licence numbers, phone numbers: `[P]`, `[Insurer A]`.
- **Plan C** is a layout sample, not from an insurer. Dropping to two plans is a one-line change in `PLAN_ORDER`.
- **Prices** are illustrative and labelled "Illustrative price, not a quote". Only the tenant contents price and the domestic-staff add-on have a source; the rest are invented.
- Plan limits and excess come from the spec (KF-E, KF-S). **Marked `[verify]`: not checked against the source PDFs** (spec R5).
- Eligibility rules are modelled on a few sources, not a real underwriting rule set.
- **Arabic copy needs native review**; digits are Western 0-9. E1 "empty" and "under 18" variants have no Arabic yet and show English.

## Test codes

Save code `123456`. Card `4242 4242 4242 4242` pays; `4000 0000 0000 0002` is declined. Any `.pdf/.jpg/.png` works for uploads. Quote and policy IDs are random.

## Known gaps

- "Edit" on the review screen returns to the next step, not back to S08.
- S06 is one full page at every width (spec: side panel at 768+).
- S05 compare rows sit inside each plan card, not as a single table.
- Call requests store the name and number in the browser only.
