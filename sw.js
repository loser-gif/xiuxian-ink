/* 墨仙录 · 离线壳。网络优先；坏响应不入库、也不当作样式或脚本交出去。版本不符则自愈。 */
'use strict';
var CACHE = 'moxian-v74';
var PRECACHE = [
  './',
  './index.html',
  './css/style.css?v=74',
  './css/fonts.css?v=74',
  './manifest.webmanifest?v=74',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
];

function kindOf(url, req) {
  var path = url.pathname;
  if (req.mode === 'navigate' || req.destination === 'document') return 'html';
  if (/\.css$/i.test(path)) return 'css';
  if (/\.js$/i.test(path)) return 'js';
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(path)) return 'img';
  if (/\.woff2?$/i.test(path)) return 'font';
  if (/\.webmanifest$/i.test(path)) return 'manifest';
  return 'other';
}

function mimeOk(res, kind) {
  if (!res || !res.ok || res.type === 'opaque') return false;
  var ct = (res.headers.get('content-type') || '').toLowerCase();
  if (kind === 'css') return !ct || ct.indexOf('text/css') !== -1;
  if (kind === 'js') return !ct || ct.indexOf('javascript') !== -1 || ct.indexOf('ecmascript') !== -1;
  if (kind === 'html') return !ct || ct.indexOf('text/html') !== -1;
  if (kind === 'font') return !ct || ct.indexOf('font') !== -1 || ct.indexOf('woff') !== -1 || ct.indexOf('octet-stream') !== -1;
  if (kind === 'img') return !ct || ct.indexOf('image/') !== -1 || ct.indexOf('octet-stream') !== -1;
  if (kind === 'manifest') return !ct || ct.indexOf('json') !== -1 || ct.indexOf('manifest') !== -1 || ct.indexOf('text/plain') !== -1 || ct.indexOf('octet-stream') !== -1;
  if (ct.indexOf('text/html') !== -1) return false;
  return true;
}

function bodyOk(res, kind) {
  if (kind !== 'css' && kind !== 'js') return Promise.resolve(true);
  return res.clone().arrayBuffer().then(function (buf) {
    var head = '';
    try { head = new TextDecoder('utf-8').decode(buf.slice(0, 96)).replace(/^\uFEFF/, '').trim().toLowerCase(); }
    catch (e) { return true; }
    if (head.indexOf('<!doctype') === 0 || head.indexOf('<html') === 0 || head.indexOf('<head') === 0) return false;
    if (kind === 'css' && head.charAt(0) === '<') return false;
    return true;
  }).catch(function () { return false; });
}

function acceptable(res, kind) {
  if (!mimeOk(res, kind)) return Promise.resolve(false);
  return bodyOk(res, kind);
}

function fromCache(cache, req) {
  return cache.match(req).then(function (hit) {
    if (hit) return hit;
    return cache.match(req, { ignoreSearch: true });
  });
}

function shell(cache) {
  return cache.match('./index.html').then(function (hit) { return hit || cache.match('./'); });
}

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.all(PRECACHE.map(function (url) {
      return fetch(new Request(url, { cache: 'reload' })).then(function (res) {
        var abs = new URL(url, self.location.href);
        var kind = (url === './' || /index\.html$/i.test(abs.pathname)) ? 'html' : kindOf(abs, { mode: '', destination: '' });
        return acceptable(res, kind).then(function (ok) { if (ok) return cache.put(url, res); });
      }).catch(function () {});
    }));
  }));
});

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'HELLO') {
    if (data.cache && data.cache !== CACHE) self.skipWaiting();
    if (event.source && event.source.postMessage) event.source.postMessage({ type: 'SW_VERSION', cache: CACHE });
  }
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function networkFirst(req, url) {
  var kind = kindOf(url, req);
  return caches.open(CACHE).then(function (cache) {
    return fetch(req).then(function (fresh) {
      return acceptable(fresh, kind).then(function (ok) {
        if (ok) {
          var stored = req.method === 'GET' ? cache.put(req, fresh.clone()) : Promise.resolve();
          return stored.then(function () { return fresh; });
        }
        return fromCache(cache, req).then(function (hit) {
          if (hit) return hit;
          if (kind === 'html') return shell(cache).then(function (page) { return page || fresh; });
          return new Response('', { status: 504, statusText: 'bad payload' });
        });
      });
    }).catch(function (err) {
      return fromCache(cache, req).then(function (hit) {
        if (hit) return hit;
        if (kind === 'html') return shell(cache).then(function (page) { if (page) return page; throw err; });
        throw err;
      });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  if (/\/sw\.js$/i.test(url.pathname)) return;
  event.respondWith(networkFirst(req, url));
});
