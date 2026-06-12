// Headless smoke test for the search + nutrition engines using the real built
// data. Run: node --experimental-strip-types scripts/smoke-test.ts
import { readFileSync } from 'node:fs';
import { FoodSearch } from '../src/search/searchEngine.ts';
import { computeMacros } from '../src/lib/nutrition.ts';

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

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
