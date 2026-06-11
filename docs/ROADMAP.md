# Database roadmap — reaching 2,000 → 10,000 foods

The task is explicitly **batched**: build the architecture first, then grow the data in
region-organized batches. The architecture, schemas, reference systems, tooling, and a
multi-region seed are complete. This doc is the plan to reach the targets.

## Where we are
Run `npm run stats` for the live count. The seed batch (200+ foods) intentionally
prioritizes **breadth** — every one of the 31 states/UTs has coverage, all 14 categories
and all 5 oil styles are exercised, and the 7 required regional thalis exist. This proves
every system end-to-end before we scale depth.

## Batch plan to 2,000
Work region-by-region; ~60–70 foods per major state and ~25–40 per smaller state gets
past 2,000. Suggested order (highest culinary breadth first):

| Wave | Regions | Target adds |
| --- | --- | --- |
| 1 | Bihar, West Bengal, UP, Punjab, Tamil Nadu, Kerala | +360 |
| 2 | Maharashtra, Gujarat, Rajasthan, Karnataka, Andhra, Telangana | +360 |
| 3 | Delhi, Haryana, MP, Chhattisgarh, Odisha, Jharkhand | +240 |
| 4 | Assam + all NE states, Goa | +200 |
| 5 | J&K, Ladakh, HP, Uttarakhand | +160 |
| 6 | Pan-India staples, high-protein, snacks, street, drinks, desserts | +480 |
| — | Thalis & combo meals (depth per region) | +40 |

Each wave: author → `normalize` → `validate` → `build` → commit.

## Quality bar per batch
- Prefer **HIGH** confidence (IFCT/NIN/USDA) for staples and raw ingredients.
- **MEDIUM** (`recipe-analysis`) is acceptable for composed dishes; document assumptions in `sourceNote`.
- Avoid fabricated precision — round sensibly and let the macro-sanity check catch typos.
- Always include at least the Indian default portion (katori/piece/plate) plus `gram`.

## Scaling to 10,000
The schema and file partitioning already support it:
- Region files can be split further (e.g. `bihar/breakfast.json`) without code changes —
  `loadAllFoods()` globs directories.
- `dist/*` indexes are generated, so search/category/region lookups scale automatically.
- Consider sharding `dist/foods.json` by region for lazy-loading in the app once large.

## Data sources to mine (batch authoring)
- **IFCT 2017** (NIN/ICMR) — Indian Food Composition Tables: best for raw ingredients & staples.
- **USDA FoodData Central** — international items, meats, fruits.
- Standardized recipe analysis for composed regional dishes (document the recipe basis).
- Brand labels for packaged/supplement items (`brand-label`, medium confidence).
