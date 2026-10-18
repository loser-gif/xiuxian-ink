/* 墨仙录 · 存档码：LZ 压缩 + CRC32，版本前缀 MX1 */
'use strict';
const Codec = (() => {
  const CRC_TAB = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TAB[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function utf8(str) { return new TextEncoder().encode(str); }
  function utf8d(bytes) { return new TextDecoder().decode(bytes); }

  /* 控制位 + 字面量 / 12bit 距离 + 4bit 长度（3–18） */
  function compress(input) {
    const n = input.length;
    const out = [];
    const head = new Map();
    let i = 0;
    while (i < n) {
      const ctrlAt = out.length;
      out.push(0);
      let ctrl = 0;
      for (let bit = 0; bit < 8 && i < n; bit++) {
        let bestLen = 0, bestDist = 0;
        const key = (input[i] << 16) | ((input[i + 1] || 0) << 8) | (input[i + 2] || 0);
        const list = head.get(key);
        if (list && i + 3 <= n) {
          const minJ = Math.max(0, i - 4095);
          for (let p = list.length - 1; p >= 0; p--) {
            const j = list[p];
            if (j < minJ) break;
            let len = 0;
            const max = Math.min(18, n - i);
            while (len < max && input[j + len] === input[i + len]) len++;
            if (len > bestLen) { bestLen = len; bestDist = i - j; if (len === 18) break; }
          }
        }
        if (bestLen >= 3) {
          ctrl |= 1 << bit;
          const pack = ((bestDist & 0xFFF) << 4) | ((bestLen - 3) & 0xF);
          out.push((pack >> 8) & 0xFF, pack & 0xFF);
          for (let k = 0; k < bestLen; k++) {
            const at = i + k;
            const kk = (input[at] << 16) | ((input[at + 1] || 0) << 8) | (input[at + 2] || 0);
            let arr = head.get(kk);
            if (!arr) { arr = []; head.set(kk, arr); }
            arr.push(at);
            if (arr.length > 32) arr.shift();
          }
          i += bestLen;
        } else {
          out.push(input[i]);
          const kk = (input[i] << 16) | ((input[i + 1] || 0) << 8) | (input[i + 2] || 0);
          let arr = head.get(kk);
          if (!arr) { arr = []; head.set(kk, arr); }
          arr.push(i);
          if (arr.length > 32) arr.shift();
          i++;
        }
      }
      out[ctrlAt] = ctrl;
    }
    return Uint8Array.from(out);
  }

  function decompress(input) {
    const out = [];
    let i = 0;
    while (i < input.length) {
      const ctrl = input[i++];
      for (let bit = 0; bit < 8 && i < input.length; bit++) {
        if (ctrl & (1 << bit)) {
          if (i + 1 >= input.length) break;
          const pack = (input[i] << 8) | input[i + 1];
          i += 2;
          const dist = pack >> 4, len = (pack & 0xF) + 3;
          if (dist < 1 || dist > out.length) throw new Error('bad dist');
          for (let k = 0; k < len; k++) out.push(out[out.length - dist]);
        } else out.push(input[i++]);
      }
    }
    return Uint8Array.from(out);
  }

  function b64(bytes) {
    let s = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function b64d(str) {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function encode(obj) {
    const raw = utf8(JSON.stringify(obj));
    const sum = crc32(raw);
    let body = compress(raw);
    let flags = 1;
    if (body.length >= raw.length) { body = raw; flags = 0; }
    const pack = new Uint8Array(2 + 4 + body.length);
    pack[0] = 1;
    pack[1] = flags;
    pack[2] = (sum >>> 24) & 0xFF;
    pack[3] = (sum >>> 16) & 0xFF;
    pack[4] = (sum >>> 8) & 0xFF;
    pack[5] = sum & 0xFF;
    pack.set(body, 6);
    return 'MX1.' + b64(pack);
  }

  function decode(text) {
    const t = String(text || '').trim().replace(/\s+/g, '');
    const m = t.match(/MX1\.([A-Za-z0-9\-_]+)/);
    if (!m) return { err: '这不是纸上仙途的存档码' };
    let pack;
    try { pack = b64d(m[1]); } catch (e) { return { err: '存档码残缺，未能读入' }; }
    if (pack.length < 6 || pack[0] !== 1) return { err: '存档码版本不合' };
    const flags = pack[1];
    const sum = ((pack[2] << 24) | (pack[3] << 16) | (pack[4] << 8) | pack[5]) >>> 0;
    const body = pack.subarray(6);
    let raw;
    try { raw = flags & 1 ? decompress(body) : body; }
    catch (e) { return { err: '存档码残缺，未能展开' }; }
    if (crc32(raw) !== sum) return { err: '校验未过，此码已损' };
    try { return { ok: true, data: JSON.parse(utf8d(raw)) }; }
    catch (e) { return { err: '卷中文字已乱' }; }
  }

  return { encode, decode, crc32, compress, decompress };
})();
