import type { Thali } from '../types/food';

// Hostel / student-friendly quick meals — practical combos that log in one tap.
// Defined client-side as thali-shaped objects so they reuse the ThaliSheet flow.
export const QUICK_MEALS: Thali[] = [
  {
    id: 'combo-mess-dal-rice-egg', name: 'Mess Dal-Rice + Eggs', region: 'pan-india', dietType: 'egg',
    description: 'Classic mess plate with a protein boost.',
    components: [
      { foodId: 'pi-toor-dal', unit: 'katori', quantity: 1 },
      { foodId: 'pi-cooked-white-rice', unit: 'katori', quantity: 1.5 },
      { foodId: 'pi-boiled-egg', unit: 'piece', quantity: 2 },
    ],
    lastReviewed: '2026-06-12',
  },
  {
    id: 'combo-milk-banana', name: 'Milk + Banana', region: 'pan-india', dietType: 'veg',
    description: 'Fast, cheap pre/post-workout fuel.',
    components: [
      { foodId: 'pi-milk-toned', unit: 'glass', quantity: 1 },
      { foodId: 'pi-banana', unit: 'piece', quantity: 1 },
    ],
    lastReviewed: '2026-06-12',
  },
  {
    id: 'combo-sattu-drink', name: 'Sattu Drink', region: 'pan-india', dietType: 'veg',
    description: 'Budget protein in a glass.',
    components: [{ foodId: 'bihar-sattu-sharbat', unit: 'glass', quantity: 1 }],
    lastReviewed: '2026-06-12',
  },
  {
    id: 'combo-curd-rice', name: 'Curd + Rice', region: 'pan-india', dietType: 'veg',
    description: 'Light, gut-friendly meal.',
    components: [
      { foodId: 'pi-cooked-white-rice', unit: 'katori', quantity: 1 },
      { foodId: 'pi-curd-dahi', unit: 'katori', quantity: 1 },
    ],
    lastReviewed: '2026-06-12',
  },
  {
    id: 'combo-eggs-roti', name: 'Eggs + Roti', region: 'pan-india', dietType: 'egg',
    description: 'High-protein quick dinner.',
    components: [
      { foodId: 'pi-boiled-egg', unit: 'piece', quantity: 3 },
      { foodId: 'pi-roti-chapati', unit: 'roti', quantity: 2 },
    ],
    lastReviewed: '2026-06-12',
  },
  {
    id: 'combo-whey-banana', name: 'Whey + Banana', region: 'pan-india', dietType: 'veg',
    description: 'Post-workout shake combo.',
    components: [
      { foodId: 'hp-whey-protein-scoop', unit: 'scoop', quantity: 1 },
      { foodId: 'pi-banana', unit: 'piece', quantity: 1 },
    ],
    lastReviewed: '2026-06-12',
  },
];
