# Macro Katori — Indian Food Database

The nutrition database that powers **Macro Katori** (a.k.a. Macro Thali). This is the
**foundation** of the product and is built as a standalone project: the database, its
schemas, and its tooling are complete **before** any app screens are built.

> **Goal:** a scalable Indian nutrition database designed to grow to **10,000+ foods**.
> **Current seed:** 200+ foods across all 31 states/UTs + 7 regional thalis, with a
> documented batch process to reach the 2,000-food target and beyond.

---

## Why a database-first approach

Wrong nutrition numbers mislead real people. So this repo treats data quality as a
first-class concern: every record declares its **source** and a **confidence** level,
macros are sanity-checked against their calories, and the portion/oil systems are
explicit and auditable rather than hidden in app code.

---

## Repository layout

```
schemas/                     JSON-Schema definitions (food, thali, custom-food)
data/
  reference/                 Controlled vocabularies everything references
    regions.json             31 states/UTs + zones + the virtual "pan-india" region
    categories.json          Category + subcategory taxonomy
    portions.json            Indian-first portion units (katori, roti, idli, litti, …)
    oil-modifiers.json       Oil styles + per-sensitivity oil-gram adjustments
    confidence-and-sources.json  Confidence levels + source references
    tags.json                Meal-tag and health-tag vocabularies
  foods/
    by-region/               Canonical food records, one file per state (+ pan-india)
    by-category/             Generic/pan-India foods grouped by category
  thalis/                    Composed meals referencing food ids
  custom/                    Templates/examples for user-created foods & saved combos
tools/                       Zero-dependency Node scripts (see below)
dist/                        Generated, app-ready artifacts (npm run build)
docs/                        Deep-dive docs (schema, scoring, oil system, roadmap)
```

### Where a food lives
Each food is stored **once**, canonically, in a `by-region/<state>.json` file (its
origin state) or `by-category/*.json` (for generic pan-India items with no single
regional home). The category dimension is then **generated** as an index in
`dist/by-category.json`, so there is no data duplication — region is the partition,
category is an index.

---

## The systems

### Portion system (Indian-first)
Every food maps real Indian serving units to **exact gram weights** for that specific
food (a katori of dal ≠ a katori of dry sabzi). Units include `katori`, `bowl`, `glass`,
`cup`, `plate`, `piece`, `ladle`, `phulka`, `roti`, `paratha`, `idli`, `dosa`, `litti`,
`baati`, and direct `gram` entry. The master list lives in `data/reference/portions.json`.

### Oil system
Stored macros are the **base** (Home Style). A food declares an `oilSensitivity`
(`none`/`low`/`medium`/`high`/`fried`). Selecting a different cooking style —
**Very Light → Home Style → Medium → Heavy → Dhaba** — adds or removes grams of cooking
oil per 100 g and recomputes calories + fat automatically. Foods can override the
defaults with a per-food `oilModifiers` block. See `docs/OIL-SYSTEM.md`.

### Confidence & source system
- **HIGH** — government / published databases: `ICMR`, `NIN`, `IFCT`, `FSSAI`, `USDA`, `published-database`
- **MEDIUM** — recipe-based estimates: `recipe-analysis`, `restaurant-menu`, `brand-label`
- **LOW** — community / user estimates: `community-estimate`, `user-created`

Confidence and source are cross-checked at validation time.

### Protein score (0–10) & health tags
`proteinScore` blends protein **density** and protein **calorie-share**, and `healthTags`
(high-protein, budget-protein, high-fiber, low-cal, vegan, …) are **auto-derived** by
`tools/normalize.js` so they stay consistent. See `docs/SCORING.md`.

### Thalis & combos
A thali is a list of `{ foodId, unit, quantity, oilStyle? }` components. Totals are
computed from the component foods by the build tool — never hand-entered. The same
component shape powers **saved meals/combos** in the custom-food system.

### Custom foods
`schemas/custom-food.schema.json` supports user-created foods, **family / mom's recipes**,
and **saved meals/combos**, with ownership and privacy fields. Examples in
`data/custom/examples.json`.

### Search
Foods are searchable by English / Hindi / local name, alias, category, region/state,
diet type, meal tag, protein level and calories. `dist/search-index.json` is a
lightweight client-ready index; `tools/search.js` is a CLI demonstrating every filter.

---

## Tooling

All scripts are plain Node (≥18), **no external dependencies**.

| Command | What it does |
| --- | --- |
| `npm run validate` | Validates every food/thali against schema rules + cross-references (regions, units, sources, tags, macro sanity). |
| `node tools/normalize.js` | Fills `proteinScore` + derived `healthTags` and stable-sorts keys in source files. Add `--check` for CI. |
| `npm run build` | Writes app-ready artifacts to `dist/` (foods, indexes, search index, thali totals, manifest). |
| `npm run stats` | Coverage report: totals, per-region/category/diet/confidence, progress to 2,000, empty-state warnings. |
| `npm run search -- <query/filters>` | CLI search (see examples below). |
| `npm run check` | `validate` + `stats`. |

### Search examples
```bash
npm run search -- "paneer"
npm run search -- --state bihar --diet veg
npm run search -- --category high-protein --min-protein 15
npm run search -- --meal breakfast --max-cal 200
npm run search -- "dal" --high-protein
```

---

## Adding foods (workflow)

1. Add records to the right `data/foods/by-region/<state>.json` (or a `by-category` file).
   You may **omit** `proteinScore` and `healthTags`.
2. Run `node tools/normalize.js` to fill computed fields.
3. Run `npm run validate` — fix any errors/warnings.
4. Run `npm run build` to refresh `dist/`.

See `docs/CONTRIBUTING-FOODS.md` for the field-by-field guide and `docs/ROADMAP.md` for
the batch plan to reach 2,000 → 10,000 foods.

---

## Status

Run `npm run stats` for the live count. The seed batch covers **all 31 states/UTs**
(no empty regions), all 14 categories, all five oil styles, the full portion system,
and 7 regional thalis. App development begins only on top of this foundation.
