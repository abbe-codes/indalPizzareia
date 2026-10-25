import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const script = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const categories = [...html.matchAll(/<section\s+class="menu-category"\s+id="([^"]+)"[\s\S]*?<\/section>/g)];

test('every menu item has exactly one positive integer order number', () => {
  assert.ok(categories.length > 0, 'Menu categories must be present');
  for (const [section, id] of categories) {
    const rows = [...section.matchAll(/<tr>\s*<th scope="row">[\s\S]*?<\/tr>/g)];
    assert.ok(rows.length > 0, `${id} must contain menu items`);
    for (const [row] of rows) {
      const name = row.match(/class="item-name">([^<]+)/)?.[1];
      const numbers = [...row.matchAll(/class="item-number">([^<]*)<\/span>/g)];
      assert.equal(numbers.length, 1, `${id}: ${name} must have exactly one number`);
      assert.match(numbers[0][1], /^[1-9]\d*$/, `${id}: ${name} must have a positive integer number`);
    }
  }
});

test('every category numbers items consecutively from one in display order', () => {
  for (const [section, id] of categories) {
    const numbers = [...section.matchAll(/class="item-number">(\d+)<\/span>/g)].map(match => Number(match[1]));
    assert.deepEqual(numbers, Array.from({ length: numbers.length }, (_, index) => index + 1), id);
  }
});

test('every category lists items from lowest to highest price', () => {
  for (const [section, id] of categories) {
    const rows = [...section.matchAll(/<tr>\s*<th scope="row">[\s\S]*?<\/tr>/g)];
    const prices = rows.map(([row]) => {
      const price = row.match(/<td>(\d+)&nbsp;kr<\/td>/);
      assert.ok(price, `${id}: each item must have a price in kronor`);
      return Number(price[1]);
    });
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b), id);
  }
});

test('drinks contain only the three generic drink options', () => {
  const drinks = categories.find(([, id]) => id === 'drycker');
  assert.ok(drinks, 'The drinks category must be present');
  const rows = [...drinks[0].matchAll(/<tr>\s*<th scope="row">[\s\S]*?<\/tr>/g)].map(([row]) => row);
  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map(row => row.match(/class="item-name">([^<]+)/)?.[1]),
    ['Burk', 'Flaska', 'Energidryck']
  );
  assert.deepEqual(
    rows.map(row => Number(row.match(/<td>(\d+)&nbsp;kr<\/td>/)?.[1])),
    [15, 25, 25]
  );
  assert.match(html, /href="#drycker">Drycker<span>3<\/span>/);
  assert.match(drinks[0], /class="category-count">3 drycker<\/span>/);
  assert.doesNotMatch(drinks[0], /Coca-Cola|Fanta|Festis/);
});

test('new menu categories and kebab additions use the requested Swedish names and prices', () => {
  const chicken = categories.find(([, id]) => id === 'kycklingmeny');
  const kebab = categories.find(([, id]) => id === 'kebabmeny');
  assert.ok(chicken, 'The chicken menu category must be present');
  assert.equal([...chicken[0].matchAll(/<tr>\s*<th scope="row">[\s\S]*?<\/tr>/g)].length, 13);
  assert.match(chicken[0], /class="item-name">Kycklingnuggets 6 st<\/span>/);
  assert.ok(kebab[0].includes('Linos Special'));
  assert.doesNotMatch(kebab[0], /Gyrospizza|Kebabpizza/);
  assert.match(html, /id="pizza"[\s\S]*?Kebabpizza Special/);
  assert.ok(html.includes('id="barnmeny"'));
  assert.ok(html.includes('<h3 id="barnmeny-title">Barnmeny</h3>'));
});

test('menu sections follow the category tab order without the extra menu tab', () => {
  const sectionOrder = [...html.matchAll(/<section\s+class="menu-category"\s+id="([^"]+)"/g)]
    .map(match => match[1]);
  assert.deepEqual(sectionOrder, [
    'pizza',
    'kycklingmeny',
    'kebabmeny',
    'sallader',
    'grill-pasta',
    'hamburgare',
    'barnmeny',
    'drycker'
  ]);
  assert.doesNotMatch(html, /class="category-nav-title"/);
});

test('menu section headers receive category-appropriate decorative thumbnails', () => {
  for (const category of ['pizza', 'chicken', 'kebab', 'salad', 'pasta', 'burger', 'nuggets', 'drink']) {
    assert.match(styles, new RegExp(`\\.category-thumbnail--${category} \\{`));
  }
  assert.match(script, /heading\.prepend\(image\)/);
  assert.doesNotMatch(script, /item\.prepend\(image\)/);
  assert.match(styles, /url\("assets\/menu-thumbnails\.jpg"\)/);
});
