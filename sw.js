/* 墨仙录 · 离线壳。网络优先；坏响应不入库、也不当作样式或脚本交出去。版本不符则自愈。 */
'use strict';
var CACHE = 'moxian-v147';
// Complete offline shell; large seasonal plates are best-effort extras.
var PRECACHE_REQUIRED = [
  './',
  './index.html',
  './css/style.css?v=147',
  './css/fonts.css?v=147',
  './css/idle.css?v=147',
  './manifest.webmanifest?v=147',
  './icon-180.png?v=147',
  './icon-192.png?v=147',
  './icon-512.png?v=147',
  './icon.svg?v=147',
  './js/data.js?v=147',
  './js/gongfa.js?v=147',
  './js/gear.js?v=147',
  './js/story.js?v=147',
  './js/sect.js?v=147',
  './js/baijia.js?v=147',
  './js/world.js?v=147',
  './js/tianxia.js?v=147',
  './js/karma.js?v=147',
  './js/life.js?v=147',
  './js/juan.js?v=147',
  './js/path.js?v=147',
  './js/calendar.js?v=147',
  './js/school.js?v=147',
  './js/school_ui.js?v=147',
  './js/core.js?v=147',
  './js/loops.js?v=147',
  './js/codec.js?v=147',
  './js/slots.js?v=147',
  './js/samsara.js?v=147',
  './js/jianghu.js?v=147',
  './js/folio.js?v=147',
  './js/arts.js?v=147',
  './js/people.js?v=147',
  './js/redworld.js?v=147',
  './js/ink.js?v=147',
  './js/ding.js?v=147',
  './js/map.js?v=147',
  './js/audio.js?v=147',
  './js/fx.js?v=147',
  './js/btfx.js?v=147',
  './js/fabaoart.js?v=147',
  './js/wallpaper.js?v=147',
  './js/album.js?v=147',
  './js/inkgl.js?v=147',
  './js/jhui.js?v=147',
  './js/scrollart.js?v=147',
  './js/portraits.js?v=147',
  './js/notices.js?v=147',
  './js/mingge.js?v=147',
  './js/mingge_ui.js?v=147',
  './js/village.js?v=147',
  './js/village_ui.js?v=147',
  './js/game.js?v=147',
  './js/idle.js?v=147',
  './fonts/wenkai-game.woff2?v=147',
  './fonts/wenkai-extra.woff2?v=147',
  './fonts/mashanzheng.woff2?v=147',
  './fonts/cao.woff2?v=147',
  './img/open-plate.png?v=147',
  './img/open-glyph.png?v=147',
  './img/open-seal-logo.png?v=147',
  './opening/xiantu.html?v=147',
];
var PRECACHE_OPTIONAL = [
  './img/season-plate-0.webp?v=147',
  './img/season-plate-1.webp?v=147',
  './img/season-plate-2.webp?v=147',
  './img/season-plate-3.webp?v=147',
];

function kindOf(url, req) {
  var path = url.pathname;
  if (req.mode === 'navigate' || req.destination === 'document' || req.destination === 'iframe' || /\.html?$/i.test(path)) return 'html';
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

function precache(cache, url) {
  return fetch(new Request(url, { cache: 'reload' })).then(function (res) {
    var abs = new URL(url, self.location.href);
    var kind = (url === './' || /index\.html$/i.test(abs.pathname)) ? 'html' : kindOf(abs, { mode: '', destination: '' });
    return acceptable(res, kind).then(function (ok) {
      if (!ok) throw new Error('Invalid offline shell response: ' + url);
      return cache.put(url, res);
    });
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    // Reject installation if any required fetch, validation or cache write fails.
    return Promise.all(PRECACHE_REQUIRED.map(function (url) {
      return precache(cache, url);
    })).then(function () {
      return Promise.all(PRECACHE_OPTIONAL.map(function (url) {
        return precache(cache, url).catch(function () {});
      }));
    });
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
