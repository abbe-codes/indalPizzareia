import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const pageFiles = new Set(['index.html', 'styles.css', 'script.js']);
const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.avif', 'image/avif'],
  ['.ico', 'image/x-icon'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function isInside(directory, candidate) {
  const path = relative(directory, candidate);
  return path !== '' && path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;

  const first = Number(match[1]);
  const last = Number(match[2]);
  if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last)) return null;

  const start = match[1] ? first : Math.max(0, size - last);
  const end = match[1] && match[2] ? Math.min(last, size - 1) : size - 1;
  return start <= end && start < size ? { start, end } : null;
}

function sendText(request, response, status, message, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(message),
    ...headers,
  });
  response.end(request.method === 'HEAD' ? undefined : message);
}

export function createStaticServer({ rootDirectory = projectDirectory } = {}) {
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendText(request, response, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
    } catch {
      sendText(request, response, 400, 'Invalid request');
      return;
    }

    if (pathname.includes('\0') || pathname.includes('\\') || !pathname.startsWith('/')) {
      sendText(request, response, 400, 'Invalid request');
      return;
    }

    const publicPath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const segments = publicPath.split('/');
    const isAsset = segments[0] === 'assets' && segments.length > 1;
    const type = contentTypes.get(extname(publicPath).toLowerCase());
    if ((!pageFiles.has(publicPath) && !isAsset) || !type || segments.some((part) => !part || part.startsWith('.'))) {
      sendText(request, response, 404, 'Not found');
      return;
    }

    try {
      const root = await realpath(rootDirectory);
      const path = await realpath(resolve(root, publicPath));
      const allowedDirectory = isAsset ? resolve(root, 'assets') : root;
      if (!isInside(allowedDirectory, path)) {
        sendText(request, response, 404, 'Not found');
        return;
      }

      const file = await stat(path);
      if (!file.isFile()) {
        sendText(request, response, 404, 'Not found');
        return;
      }

      const headers = {
        'Content-Type': type,
        'Content-Length': file.size,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      };
      let range;
      if (request.method === 'GET' && request.headers.range) {
        range = parseRange(request.headers.range, file.size);
        if (!range) {
          sendText(request, response, 416, 'Range not satisfiable', { 'Content-Range': `bytes */${file.size}` });
          return;
        }
        headers['Content-Length'] = range.end - range.start + 1;
        headers['Content-Range'] = `bytes ${range.start}-${range.end}/${file.size}`;
      }

      response.writeHead(range ? 206 : 200, headers);
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      await pipeline(createReadStream(path, range ?? {}), response);
    } catch (error) {
      if (response.destroyed || response.headersSent) {
        response.destroy();
        return;
      }
      const missing = error.code === 'ENOENT' || error.code === 'ENOTDIR';
      sendText(request, response, missing ? 404 : 500, missing ? 'Not found' : 'Unable to serve this file');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createStaticServer();
  server.on('error', (error) => {
    console.error(error.code === 'EADDRINUSE' ? 'Port 5173 is already in use.' : 'Unable to start the local server.');
    process.exitCode = 1;
  });
  server.listen(5173, '127.0.0.1', () => {
    console.log('Indal Pizzeria: http://127.0.0.1:5173');
  });
}
