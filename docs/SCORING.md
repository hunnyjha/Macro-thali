# Protein score & health tags

## Protein score (0–10)
Implemented in `tools/lib.js → proteinScore(per100g)`. It blends two ideas:

1. **Density** — how much protein per 100 g. `density = min(protein / 3, 10)`
   (≈10 at 30 g protein/100 g).
2. **Calorie share** — how "lean" that protein is. `share = min(protein*4 / calories, 1) * 10`
   (rewards foods where protein is a large fraction of energy).

```
score = round( 0.6 * density + 0.4 * share )   // clamped to 0..10
```

Examples: grilled chicken breast → 10, boiled egg → 7, roti → 2, white rice → 1,
ghee/oil → 0. The score is auto-filled by `normalize.js` when omitted, so it stays
consistent across the whole catalog.

## Health tags (auto-derived)
`tools/lib.js → deriveHealthTags(food)` merges manual tags with rules:

| Tag | Rule |
| --- | --- |
| `high-protein` | protein ≥ 12 g/100g **or** proteinScore ≥ 7 |
| `low-cal` | ≤ 100 kcal/100g |
| `high-cal` | ≥ 300 kcal/100g |
| `high-fiber` | fiber ≥ 6 g/100g |
| `high-fat` | fat ≥ 20 g/100g |
| `high-carb` | carbs ≥ 50 g/100g |
| `fried` | `oilSensitivity === "fried"` |

Tags that can't be inferred from macros (`vegan`, `budget-protein`, `probiotic`,
`fermented`, `diabetic-friendly`, `weight-loss`, `post-workout`, …) are added manually
and preserved by the normalizer. Full vocabulary: `data/reference/tags.json`.

> Re-run `node tools/normalize.js` after changing the scoring rules to refresh every record.
