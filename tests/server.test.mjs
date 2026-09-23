import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createStaticServer } from '../scripts/serve.mjs';

let directory;
let server;
let port;

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'indal-pizzeria-test-'));
  await mkdir(join(directory, 'assets'));
  await mkdir(join(directory, '.git'));
  await Promise.all([
    writeFile(join(directory, 'index.html'), '<h1>Indal Pizzeria</h1>'),
    writeFile(join(directory, 'styles.css'), 'body { color: red; }'),
    writeFile(join(directory, 'script.js'), 'const ready = true;'),
    writeFile(join(directory, 'package.json'), '{"private":true}'),
    writeFile(join(directory, '.git', 'config'), 'private'),
    writeFile(join(directory, 'assets', 'hero.mp4'), '0123456789'),
    writeFile(join(directory, 'assets', 'icon.svg'), '<svg></svg>'),
    writeFile(join(directory, 'assets', '.hidden.svg'), 'private'),
  ]);
  server = createStaticServer({ rootDirectory: directory });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  port = server.address().port;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (directory) await rm(directory, { recursive: true, force: true });
});

function get(path, { method = 'GET', headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const call = request({ hostname: '127.0.0.1', port, path, method, headers }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
      response.on('error', reject);
    });
    call.on('error', reject);
    call.end();
  });
}

test('serves the page at both supported URLs, including a query string', async () => {
  for (const path of ['/', '/index.html', '/?preview=true']) {
    const result = await get(path);
    assert.equal(result.status, 200);
    assert.equal(result.body, '<h1>Indal Pizzeria</h1>');
    assert.equal(result.headers['content-type'], 'text/html; charset=utf-8');
    assert.equal(result.headers['x-content-type-options'], 'nosniff');
  }
});

test('serves styles, scripts, images, and video with their content types', async () => {
  for (const [path, type] of [
    ['/styles.css', 'text/css; charset=utf-8'],
    ['/script.js', 'text/javascript; charset=utf-8'],
    ['/assets/icon.svg', 'image/svg+xml'],
    ['/assets/hero.mp4', 'video/mp4'],
  ]) {
    const result = await get(path);
    assert.equal(result.status, 200);
    assert.equal(result.headers['content-type'], type);
    assert.ok(result.body.length > 0);
  }
});

test('HEAD returns the full content length without a response body', async () => {
  const result = await get('/assets/hero.mp4', { method: 'HEAD', headers: { Range: 'bytes=0-2' } });
  assert.equal(result.status, 200);
  assert.equal(result.headers['content-length'], '10');
  assert.equal(result.body, '');
});

test('unavailable files, directory listings, and project internals are not served', async () => {
  for (const path of ['/missing', '/assets/missing.svg', '/assets/', '/package.json', '/.git/config', '/assets/.hidden.svg', '/scripts/serve.mjs']) {
    const result = await get(path);
    assert.equal(result.status, 404, path);
  }
});

test('rejects path traversal and malformed path encodings', async () => {
  for (const path of ['/assets/../index.html', '/assets/%2e%2e/index.html', '/assets/%2e%2e%2findex.html']) {
    assert.equal((await get(path)).status, 404, path);
  }
  for (const path of ['/assets/%zz', '/assets/%00.svg', '/assets/%5c..%5cindex.html']) {
    assert.equal((await get(path)).status, 400, path);
  }
});

test('rejects unsupported HTTP methods', async () => {
  const result = await get('/', { method: 'POST' });
  assert.equal(result.status, 405);
  assert.equal(result.headers.allow, 'GET, HEAD');
});

test('supports bounded, open-ended, and suffix byte ranges for video playback', async () => {
  for (const [range, body, contentRange] of [
    ['bytes=2-5', '2345', 'bytes 2-5/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'],
    ['bytes=8-100', '89', 'bytes 8-9/10'],
    ['bytes=-100', '0123456789', 'bytes 0-9/10'],
  ]) {
    const result = await get('/assets/hero.mp4', { headers: { Range: range } });
    assert.equal(result.status, 206, range);
    assert.equal(result.body, body);
    assert.equal(result.headers['content-range'], contentRange);
    assert.equal(Number(result.headers['content-length']), body.length);
  }
});

test('reports unsatisfiable or unsupported ranges without exposing file contents', async () => {
  for (const range of ['bytes=10-', 'bytes=5-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4', 'invalid']) {
    const result = await get('/assets/hero.mp4', { headers: { Range: range } });
    assert.equal(result.status, 416, range);
    assert.equal(result.headers['content-range'], 'bytes */10');
    assert.equal(result.body, 'Range not satisfiable');
  }
});
