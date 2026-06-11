# Oil system

Indian dishes vary enormously in oil depending on who cooks them. Rather than store five
copies of every dish, we store **one base record** and adjust it.

## Model
- Stored `per100g` macros = the dish cooked **Home Style** (`baseStyle` in `oil-modifiers.json`).
- Each food declares an `oilSensitivity`: `none`, `low`, `medium`, `high`, `fried`.
- The user picks a **cooking style**: `very_light`, `home_style`, `medium`, `heavy`, `dhaba`.
- Each (sensitivity × style) maps to **grams of cooking oil added/removed per 100 g**
  (negative for lighter-than-home cooking).

## Math
```
addedOilGrams = oilGramsPer100g[style] * (servingGrams / 100)
fat      += addedOilGrams                 // oil is ~100% fat
calories += addedOilGrams * kcalPerGramOil // 8.84 kcal/g
```
Protein, carbs and fiber are unaffected by cooking oil. Reference implementation:
`computeMacros()` in `tools/lib.js`.

## Per-food override
When a dish doesn't fit its sensitivity bucket, add an explicit `oilModifiers` object
(grams/100g per style), e.g. roti barely changes with style:
```json
"oilModifiers": { "very_light": 0, "home_style": 0, "medium": 2, "heavy": 4, "dhaba": 5 }
```

## Worked example
`pi-aloo-gobi` (oilSensitivity `medium`, base 110 kcal/100g), one katori = 120 g, **Dhaba**:
- `oilGramsPer100g.medium.dhaba = 9` → `addedOil = 9 * 1.2 = 10.8 g`
- calories `110*1.2 + 10.8*8.84 = 132 + 95.5 ≈ 227.5`
- fat `5.5*1.2 + 10.8 = 6.6 + 10.8 = 17.4 g`

Tune the global curves in `data/reference/oil-modifiers.json`; every dependent food updates.
