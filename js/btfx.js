/* 墨仙录 · 破境分境仪式：筑基／金丹／元婴／化神／渡劫 — 各不相同 */
'use strict';
const BtFx = (() => {
  const $ = s => document.querySelector(s);
  const R = () => (typeof FX !== 'undefined' && FX.reduced && FX.reduced());
  const sleep = ms => new Promise(r => setTimeout(r, R() ? Math.min(ms, 80) : ms));
  let write = (el, text) => { if (el) el.textContent = text; };

  const META = {
    0: {
      name: '筑基', seal: '基', sub: '地脉入体 · 根基初立',
      lines: ['地脉震颤，石纹如墨', '引脉入丹田，凝为一基……'],
    },
    1: {
      name: '金丹', seal: '丹', sub: '炉火九转 · 一粒金丹',
      lines: ['丹田成炉，真火暗燃', '九转凝元，金丹将成……'],
    },
    2: {
      name: '元婴', seal: '婴', sub: '金丹开裂 · 婴成识海',
      lines: ['金丹表面裂纹如蛛', '一缕神识凝成元婴……'],
    },
    3: {
      name: '化神', seal: '神', sub: '神识出窍 · 问天问地',
      lines: ['识海如潮，神识欲出', '鹤影穿云，化神在即……'],
    },
    4: {
      name: '飞升', seal: '升', sub: '九重天劫 · 白日飞升',
      lines: ['劫云压顶，雷纹九迭', '天门将启……'],
    },
  };

  function setWriter(fn) { if (typeof fn === 'function') write = fn; }

  function clearStage() {
    for (const id of ['bt-clouds', 'bt-veins', 'bt-bolts', 'bt-stairs']) {
      const el = document.getElementById(id); if (el) el.innerHTML = '';
    }
  }

  function buildStage(from) {
    clearStage();
    const veins = document.getElementById('bt-veins');
    const clouds = document.getElementById('bt-clouds');
    const bolts = document.getElementById('bt-bolts');
    const stairs = document.getElementById('bt-stairs');
    if (from === 0 && veins) {
      for (let i = 0; i < 7; i++) {
        const d = document.createElement('i');
        d.style.setProperty('--i', i);
        d.style.setProperty('--a', ((i / 7) * 360) + 'deg');
        veins.appendChild(d);
      }
    }
    if (from === 4 && clouds) {
      for (let i = 0; i < 5; i++) {
        const c = document.createElement('i');
        c.style.setProperty('--i', i);
        clouds.appendChild(c);
      }
    }
    if (from === 4 && bolts) {
      for (let i = 0; i < 4; i++) {
        const b = document.createElement('i');
        b.style.setProperty('--i', i);
        bolts.appendChild(b);
      }
    }
    if (from === 4 && stairs) {
      for (let i = 0; i < 7; i++) {
        const s = document.createElement('i');
        s.style.setProperty('--i', i);
        stairs.appendChild(s);
      }
    }
    if (from === 3 && stairs) {
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('i');
        s.className = 'bt-scroll';
        s.style.setProperty('--i', i);
        stairs.appendChild(s);
      }
    }
  }

  function prepare(bt, from, ok) {
    const m = META[from] || META[0];
    bt.className = 'bt';
    bt.classList.add('r' + from);
    if (from === 4) bt.classList.add('ascend');
    buildStage(from);
    const sub = document.getElementById('bt-sub');
    if (sub) sub.textContent = m.sub;
    const st = document.getElementById('bt-stamp-t');
    if (st) st.textContent = ok ? m.seal : '败';
    return m;
  }

  async function chargePhase(bt, from, usePill, realmPill) {
    const m = META[from] || META[0];
    const lines = document.getElementById('bt-lines');
    if (lines) lines.innerHTML = '';
    const l1 = document.createElement('div');
    if (lines) lines.appendChild(l1);
    write(l1, usePill ? ((from === 4 ? '燃起' : '服下') + realmPill + '，' + m.lines[0]) : m.lines[0]);
    await sleep(R() ? 120 : 1000);
    bt.classList.add('charge');
    const l2 = document.createElement('div');
    if (lines) lines.appendChild(l2);
    write(l2, m.lines[1]);
    if (!R() && typeof FX !== 'undefined') {
      const cx = innerWidth / 2, cy = innerHeight * 0.42;
      if (from === 0 && FX.qiSwirl) FX.qiSwirl(cx, cy);
      if (from === 1 && FX.goldMotes) FX.goldMotes(cx, cy, 12);
      if (from === 4 && FX.goldMotes) FX.goldMotes(cx, cy * 0.7, 8);
    }
    await sleep(R() ? 160 : (from === 4 ? 2200 : 1800));
    bt.classList.remove('charge');
  }

  async function revealPhase(bt, from, ok) {
    bt.classList.add('reveal');
    if (ok) {
      await sleep(R() ? 80 : 860);
      bt.classList.add('glory', 'weight');
      if (typeof MoAudio !== 'undefined') {
        MoAudio.play(from === 4 ? 'gold' : 'splash');
        MoAudio.play('gold');
      }
      await sleep(R() ? 100 : (from === 4 ? 980 : 760));
    } else {
      await sleep(R() ? 100 : 1200);
      if (typeof MoAudio !== 'undefined') MoAudio.play('fail');
      bt.classList.add('fail', 'crack', 'shake');
      await sleep(R() ? 80 : 500);
    }
  }

  return { META, setWriter, prepare, chargePhase, revealPhase, clearStage, sleep };
})();
