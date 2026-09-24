import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
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
