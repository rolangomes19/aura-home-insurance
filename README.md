# Aura home insurance: lo-fi prototype

Click-through prototype of a UAE home-insurance broker flow. Responsive at 390, 768 and 1280 px. English throughout; Arabic (right-to-left) on P1, P3 and Help only. Built from `feature-update-brief.md` v2 (it replaces the screen list, prices and Plan C of `prototype-spec.md` v1).

**Prototype, not a real offer.** All insurers, prices, IDs and payments are fake. That Aura is a licensed broker is a **case premise** (brief decision 1); Aura's own site describes SaaS for insurers.

## Run

Vanilla HTML/CSS/JS, no build step. ES modules need a web server (not `file://`):

```bash
python -m http.server 8123
```

Open http://localhost:8123. Tests (engine and story, no DOM):

```bash
npm test
```

## Flow

P1 Your home, P2 Your cover (live "From AED x to y"), P3 Plans and price, P4 Save your quote, P5 Review and confirm, P6 ID, P7 Pay, P8 Confirmation. Help (not eligible or referred) is reachable from P1, P2 and P3. That is 7 pages to payment, with the first price on page 2.

## Layout

| Path | Role |
| --- | --- |
| `js/domain.js` | Roles, covers, plans A/B/C, limits, excess, band prices, building rates, add-ons, eligibility rules |
| `js/engine.js` | Pure functions, the only price source: `basePrice`, `getTotals`, `rangeFor`, `carryAddOns`, `suggest`, `eligibility`, `fits` |
| `js/story.js` | The answers as a first-person account; each token opens a pop-up with a Change link |
| `js/data.js`, `copy-*.js` | All copy (EN, AR for P1, P3, Help). No copy in renderers |
| `js/app.js` | Router, state (localStorage), `price()` helper, term tips, story panel |
| `js/screens.js`, `plans.js`, `buy.js` | P1, P2, Help; P3; P4 to P8 |

## Decisions taken for v2

- **"What matters most?"** on P3 (Lower excess, the default; Lower price; Extras included). With lower excess, the invented Plan C is suggested in every contents path (brief section 14), so the price gap line shows the extra cost and the user can re-rank.
- **Plan B** charges the belongings band when belongings are chosen (12.1: 515). With contents only it lists belongings under "Also includes" at no charge.
- The answers stay as the first-person story panel (Phase 8). At 390 and 768 it is a collapsed bar on top. P5 has a plain list with Edit links that return to P5.
- Add-ons carry over by type when the plan changes. An add-on the new plan includes drops from the selection and shows "Included". One it does not offer is removed with a notice.
- Persona B "fewer pages than Persona A" (12.2) no longer applies, because every path has the same pages. A tenant has fewer inputs on P2 (4, against 6 for an owner with full cover).
- Money is whole AED. Every illustrative price is whole and building cover is rounded, so fils add nothing here. A live product needs fils (K12 shows AED 390.84).

## What is placeholder

- Insurer names, licence numbers, phone numbers, logo: `[P]`, `[Insurer A]`, `[Logo]`.
- **Plan C** is invented and tagged "Sample plan" on screen.
- **Prices** are illustrative and labelled "Illustrative price, not a quote". Only contents 1 to 50,000 for A and C (K22), domestic staff on A (AED 83) and cyber on C (AED 78, K12) have a source. Building rates sit in a range the sources disagree on (M3).
- Plan limits and excess come from KF-E and KF-S. **Not checked against the source PDFs** (R5).
- Eligibility and referral rules are placeholders (A5). The high-value referral (rebuild over AED 20,000,000 or the top value band) is invented.
- **Arabic copy needs native review.** That covers the strings from brief section 11 and the drafts written for gaps (P1 questions, the P3 add-ons, panel and drawer, the Help variants, the call sheet). Digits are Western 0 to 9.

## Test codes

Save code `123456`. Card `4242 4242 4242 4242` pays; any card ending `0002` is declined. Any `.pdf/.jpg/.png` works for uploads. Quote and policy IDs are random.

## Known gaps

- Building-only cover still shows the contents excess and single item limit rows on P3. The brief fixes 4 key rows for every plan.
- Changing the plan back after an add-on became "Included" does not restore that add-on.
- Two-factor login, UAE data hosting and the approved authorisation form text are out of scope (brief 13).
- Call requests store the name and number in the browser only.
