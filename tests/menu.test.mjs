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

test('drinks include both 50 cl cola options at 25 kr alongside the existing 15 kr options', () => {
  const drinks = categories.find(([, id]) => id === 'drycker');
  assert.ok(drinks, 'The drinks category must be present');
  const rows = [...drinks[0].matchAll(/<tr>\s*<th scope="row">[\s\S]*?<\/tr>/g)].map(([row]) => row);
  assert.equal(rows.length, 8);
  assert.equal(rows.filter(row => row.includes('<td>15&nbsp;kr</td>')).length, 6);
  for (const name of ['Coca-Cola', 'Coca-Cola Zero']) {
    const matchingRows = rows.filter(row => row.includes(`class="item-name">${name}</span>`) && row.includes('class="item-description">50 cl</span>'));
    assert.equal(matchingRows.length, 1, `${name} must have exactly one 50 cl option`);
    assert.ok(matchingRows[0].includes('<td>25&nbsp;kr</td>'), `${name} 50 cl must cost 25 kr`);
  }
  assert.match(html, /href="#drycker">Drycker<span>8<\/span>/);
  assert.match(drinks[0], /class="category-count">8 drycker<\/span>/);
  assert.doesNotMatch(drinks[0], /Alla drycker kostar 15 kr/);
});
