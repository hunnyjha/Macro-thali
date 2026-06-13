// Headless smoke test for the search + nutrition engines using the real built
// data. Run: node --experimental-strip-types scripts/smoke-test.ts
import { readFileSync } from 'node:fs';
import { FoodSearch } from '../src/search/searchEngine.ts';
import { computeMacros } from '../src/lib/nutrition.ts';
import { calculate, caloriesForGoal, type Profile } from '../src/lib/calculator.ts';
import { parseMeal } from '../src/lib/nlParse.ts';

const read = (p: string) => JSON.parse(readFileSync(new URL(`../public/data/${p}`, import.meta.url), 'utf8'));

const docs = read('search-index.json');
const oil = read('reference/oil-modifiers.json');
const portions = read('reference/portions.json');
const categories = read('reference/categories.json');
const regions = read('reference/regions.json');
const tags = read('reference/tags.json');
const foods = read('foods.json');

const ref = {
  oil, portions, categories, regions, tags,
  portionName: new Map(portions.units.map((u: any) => [u.code, u.name])),
  categoryName: new Map(categories.categories.map((c: any) => [c.code, c.name])),
  stateName: new Map(regions.regions.map((r: any) => [r.code, r.name])),
};

const search = new FoodSearch(docs, ref as any);
let pass = 0, fail = 0;
const check = (label: string, cond: boolean, detail = '') => {
  console.log(`${cond ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  cond ? pass++ : fail++;
};
const names = (q: string, f = {}) => search.search(q, f, 8).map((d: any) => d.name);
const has = (q: string, sub: string, f = {}) =>
  search.search(q, f, 30).some((d: any) => d.name.toLowerCase().includes(sub.toLowerCase()));

console.log('\n— SEARCH —');
check('"sattu" finds sattu', has('sattu', 'sattu'), names('sattu')[0]);
check('"sattu drink" finds sattu sharbat', has('sattu drink', 'sattu'), names('sattu drink')[0]);
check('"dahi" finds curd', has('dahi', 'curd') || has('dahi', 'dahi'), names('dahi')[0]);
check('"curd" finds curd', has('curd', 'curd'), names('curd')[0]);
check('"buttermilk" finds chaas', has('buttermilk', 'chaas'), names('buttermilk')[0]);
check('"chaas" finds chaas', has('chaas', 'chaas'), names('chaas')[0]);
check('"poha" finds poha', has('poha', 'poha'), names('poha')[0]);
check('"flattened rice" finds poha', has('flattened rice', 'poha'), names('flattened rice')[0]);
check('"paneer" finds paneer', has('paneer', 'paneer'), names('paneer')[0]);
check('misspelling "panir" still finds paneer', has('panir', 'paneer'), names('panir')[0]);
check('"protein" returns high-protein foods', search.search('protein', {}, 10).every((d: any) => d.protein >= 12 || d.ps >= 7), names('protein').join(', '));
check('"bihar" returns Bihari foods', search.search('bihar', {}, 10).every((d: any) => d.state === 'bihar'), `${search.search('bihar', {}, 50).length} items`);
check('"breakfast" returns breakfast foods', search.search('breakfast', {}, 10).every((d: any) => d.meal.includes('breakfast')), `${search.search('breakfast', {}, 50).length} items`);
check('"veg" filters to veg', search.search('veg', {}, 10).every((d: any) => d.diet === 'veg'));
check('filter highProtein chip works', search.search('', { highProtein: true }, 10).every((d: any) => d.protein >= 12 || d.ps >= 7));

console.log('\n— OIL INTELLIGENCE —');
const aloo = foods.find((f: any) => f.id === 'pi-aloo-gobi');
const light = computeMacros(aloo, 120, 'very_light', oil);
const home = computeMacros(aloo, 120, 'home_style', oil);
const dhaba = computeMacros(aloo, 120, 'dhaba', oil);
console.log(`  Aloo Gobi 1 katori (120g): light=${light.calories} home=${home.calories} dhaba=${dhaba.calories} kcal`);
check('oil level changes calories', light.calories < home.calories && home.calories < dhaba.calories);
check('oil level changes fat', light.fat < dhaba.fat);
check('protein unaffected by oil', light.protein === dhaba.protein);

console.log('\n— PORTIONS —');
const rice = foods.find((f: any) => f.id === 'pi-cooked-white-rice');
const oneKatori = computeMacros(rice, rice.portions.find((p: any) => p.unit === 'katori').grams, 'home_style', oil);
console.log(`  1 katori cooked rice = ${oneKatori.calories} kcal, ${oneKatori.protein}g protein`);
check('katori portion computes', oneKatori.calories > 150 && oneKatori.calories < 250);

console.log('\n— CALCULATOR —');
const prof: Profile = { age: 25, sex: 'male', weightKg: 70, heightCm: 175, activity: 'moderate', goal: 'loss', speed: 0.5 };
const r = calculate(prof);
console.log(`  25M 70kg 175cm moderate: BMR=${r.bmr} maintain=${r.maintenance} loss=${r.loss} gain=${r.gain}`);
console.log(`  loss target: ${r.target.calories} kcal · ${r.target.protein}P / ${r.target.carbs}C / ${r.target.fat}F`);
check('BMR in expected range (~1650)', r.bmr > 1600 && r.bmr < 1750);
check('maintenance = BMR × 1.55', Math.abs(r.maintenance - r.bmr * 1.55) <= 5);
check('loss < maintain < gain', r.loss < r.maintenance && r.maintenance < r.gain);
check('fat-loss protein ≥ 2g/kg', r.target.protein >= 140);
check('macros roughly sum to target kcal', Math.abs((r.target.protein * 4 + r.target.carbs * 4 + r.target.fat * 9) - r.target.calories) < 60);

console.log('\n— NUTRITION FILTERS —');
check('low-cal filter ≤120 kcal', search.search('', { nutri: 'low-cal' }, 50).every((d: any) => d.kcal <= 120));
check('high-fiber filter ≥6g', search.search('', { nutri: 'high-fiber' }, 50).every((d: any) => d.fiber >= 6));
check('low-fat filter ≤5g', search.search('', { nutri: 'low-fat' }, 50).every((d: any) => d.fat <= 5));
check('high-carb filter ≥20g', search.search('', { nutri: 'high-carb' }, 50).every((d: any) => d.carbs >= 20));

console.log('\n— NATURAL LANGUAGE PARSE —');
const p1 = parseMeal('2 roti + dahi');
check('"2 roti + dahi" -> 2 segments', p1.segments.length === 2, JSON.stringify(p1.segments));
check('roti qty=2, food kept', p1.segments[0].qty === 2 && p1.segments[0].query.includes('roti'));
check('second segment dahi', p1.segments[1]?.query.includes('dahi'));
const p2 = parseMeal('3 eggs and 250ml milk');
check('eggs qty=3', p2.segments[0]?.qty === 3 && p2.segments[0]?.query.includes('egg'));
check('250ml milk parsed', p2.segments[1]?.qty === 250 && p2.segments[1]?.unit === 'ml');
const p3 = parseMeal('breakfast mein 4 eggs aur chai');
check('slot detected breakfast', p3.slot === 'breakfast' && p3.segments.length === 2, JSON.stringify(p3));

console.log('\n— GOALS & SPEEDS —');
const m = calculate({ age: 25, sex: 'male', weightKg: 70, heightCm: 175, activity: 'moderate', goal: 'maintain', speed: 0 }).maintenance;
check('loss deltas 550/825/1100', caloriesForGoal(3000, 'male', 'loss', 0.5) === 2450 && caloriesForGoal(3000, 'male', 'loss', 0.75) === 2175 && caloriesForGoal(3000, 'male', 'loss', 1) === 1900);
check('gain deltas 275/550/825', caloriesForGoal(m, 'male', 'gain', 0.25) === m + 275 && caloriesForGoal(m, 'male', 'gain', 0.5) === m + 550 && caloriesForGoal(m, 'male', 'gain', 0.75) === m + 825);
check('maintain ignores speed', caloriesForGoal(m, 'male', 'maintain', 0) === m);
check('male floor 1500', caloriesForGoal(1600, 'male', 'loss', 1) === 1500);
check('female floor 1200', caloriesForGoal(1300, 'female', 'loss', 1) === 1200);
const maint = calculate({ age: 25, sex: 'male', weightKg: 70, heightCm: 175, activity: 'moderate', goal: 'maintain', speed: 0 });
check('maintain protein 1.8 g/kg (126g @ 70kg)', maint.target.protein === 126);

console.log('\n— VERIFICATION & WHEY —');
check('whey foods are verified + branded', search.search('whey', {}, 20).filter((d: any) => d.brand).every((d: any) => d.vs === 'verified' && d.sp === 1));
check('"biozyme" finds MuscleBlaze (verified)', search.search('biozyme', {}, 5).some((d: any) => d.name.includes('Biozyme') && d.vs === 'verified'));
check('"iso100" finds Dymatize', has('iso100', 'ISO100'));
check('"optimum nutrition" finds ON whey', has('optimum nutrition', 'Gold Standard'));
check('every doc has a verificationStatus', docs.every((d: any) => ['verified', 'estimated', 'community'].includes(d.vs)));
check('dal tadka present & estimated', search.search('dal tadka', {}, 5).some((d: any) => d.name === 'Dal Tadka' && d.vs === 'estimated'));
check('veg biryani present', has('veg biryani', 'Veg Biryani'));
check('rajma chawal present', has('rajma chawal', 'Rajma Chawal'));

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
