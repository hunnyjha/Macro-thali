// Quick Add chips — the foods Indians log most often, mapped to catalog ids.
// One tap opens the quantity/portion sheet for instant logging.
export const QUICK_ADD: { label: string; emoji: string; foodId: string }[] = [
  { label: 'Eggs', emoji: '🥚', foodId: 'pi-boiled-egg' },
  { label: 'Roti', emoji: '🫓', foodId: 'pi-roti-chapati' },
  { label: 'Rice', emoji: '🍚', foodId: 'pi-cooked-white-rice' },
  { label: 'Dal', emoji: '🥣', foodId: 'pi-toor-dal' },
  { label: 'Milk', emoji: '🥛', foodId: 'pi-milk-toned' },
  { label: 'Dahi', emoji: '🍶', foodId: 'pi-curd-dahi' },
  { label: 'Chicken', emoji: '🍗', foodId: 'pi-chicken-curry' },
  { label: 'Banana', emoji: '🍌', foodId: 'pi-banana' },
  { label: 'Whey', emoji: '💪', foodId: 'hp-whey-protein-scoop' },
  { label: 'Poha', emoji: '🍛', foodId: 'pi-poha' },
];

// Budget-friendly Indian protein sources (for gap suggestions).
export const BUDGET_PROTEIN_IDS = [
  'pi-boiled-egg',
  'bihar-sattu-sharbat',
  'hp-roasted-chana',
  'pi-milk-toned',
  'pi-soya-chunks-cooked',
  'pi-curd-dahi',
  'pi-sprouts-salad',
  'pi-paneer-raw',
];
