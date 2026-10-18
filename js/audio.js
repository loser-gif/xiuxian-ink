/* 墨仙录 · 氛围音效（纯 Web Audio，无外链采样） */
(function (global) {
  const KEY = 'moxian.audio';
  const RM = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => !!(RM && RM.matches);

  let pref = { muted: true, vol: 0.55 };  // 默认静音，点「声」后启声
  try { Object.assign(pref, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}

  let ctx = null, master = null, ambBus = null, sfxBus = null, unlocked = false;
  let amb = { mode: 'off', place: null, season: 0, nodes: [], gain: null, fire: null };
  let duck = 1, hidden = false, uiLast = 0;

  function save() { try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (e) {} }

  function ensure() {
    if (ctx) return ctx;
    const AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0;
    ambBus = ctx.createGain(); ambBus.gain.value = 0.42;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.85;
    ambBus.connect(master); sfxBus.connect(master); master.connect(ctx.destination);
    applyGain(true);
    return ctx;
  }

  function applyGain(instant) {
    if (!master) return;
    const v = (pref.muted || hidden || !unlocked) ? 0 : pref.vol * duck;
    const g = master.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t);
    if (instant) g.value = v;
    else { g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(v, t + 0.45); }
  }

  async function unlock() {
    ensure();
    if (!ctx) return false;
    if (ctx.state === 'suspended') try { await ctx.resume(); } catch (e) {}
    if (!unlocked) {
      unlocked = true;
      // 静音点一下解锁，避免 iOS 后续失败
      const o = ctx.createOscillator(), g = ctx.createGain();
      g.gain.value = 0.0001; o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.01);
      applyGain(false);
      if (!pref.muted) startAmbient(amb.mode || 'title');
    }
    return true;
  }

  function noiseBuf(sec = 1.2) {
    const n = Math.max(1, Math.floor(ctx.sampleRate * sec));
    const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2 + (Math.random() * 2 - 1) * 0.15; }
    return b;
  }

  function env(g, a, peak, hold, rel, t0) {
    const t = t0 ?? ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.setValueAtTime(Math.max(peak, 0.0002), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  }

  function tone(freq, dur, type, peak, dest, opts = {}) {
    if (!ctx || pref.muted || hidden) return;
    const t0 = ctx.currentTime + (opts.delay || 0);
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur * 0.85);
    const f = ctx.createBiquadFilter(); f.type = opts.filter || 'lowpass'; f.frequency.value = opts.cut || 1800;
    f.Q.value = opts.Q || 0.7;
    const g = ctx.createGain();
    o.connect(f); f.connect(g); g.connect(dest || sfxBus);
    env(g, opts.a || 0.02, peak, opts.hold || dur * 0.25, opts.rel || dur * 0.7, t0);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function burst(dur, peak, dest, opts = {}) {
    if (!ctx || pref.muted || hidden) return;
    const t0 = ctx.currentTime + (opts.delay || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(Math.min(2, dur + 0.3));
    const f = ctx.createBiquadFilter(); f.type = opts.filter || 'bandpass';
    f.frequency.value = opts.cut || 1200; f.Q.value = opts.Q || 0.8;
    if (opts.cutTo) f.frequency.exponentialRampToValueAtTime(opts.cutTo, t0 + dur);
    const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(dest || sfxBus);
    env(g, opts.a || 0.005, peak, opts.hold || 0.02, opts.rel || dur * 0.9, t0);
    src.start(t0); src.stop(t0 + dur + 0.08);
  }

  /* ---------- SFX ---------- */
  const SFX = {
    drip() {
      burst(0.12, 0.045, sfxBus, { cut: 2400, Q: 1.4, filter: 'bandpass', a: 0.002, rel: 0.1 });
      tone(680 + Math.random() * 120, 0.14, 'sine', 0.03, sfxBus, { a: 0.002, rel: 0.12, cut: 2200 });
    },
    paper() {
      burst(0.35, 0.06, sfxBus, { cut: 1800, cutTo: 600, Q: 0.55, filter: 'bandpass', a: 0.01, hold: 0.04, rel: 0.28 });
      burst(0.22, 0.035, sfxBus, { delay: 0.06, cut: 900, Q: 0.4, filter: 'highpass', a: 0.02, rel: 0.18 });
    },
    stamp() {
      burst(0.18, 0.14, sfxBus, { cut: 400, Q: 0.9, filter: 'lowpass', a: 0.001, hold: 0.02, rel: 0.14 });
      tone(90, 0.22, 'triangle', 0.09, sfxBus, { a: 0.001, hold: 0.03, rel: 0.16, cut: 500 });
      burst(0.08, 0.05, sfxBus, { delay: 0.04, cut: 2200, Q: 2, filter: 'bandpass' });
    },
    breath() {
      burst(0.9, 0.055, sfxBus, { cut: 500, cutTo: 1400, Q: 0.6, filter: 'bandpass', a: 0.18, hold: 0.15, rel: 0.55 });
      burst(0.85, 0.04, sfxBus, { delay: 0.55, cut: 1600, cutTo: 400, Q: 0.5, filter: 'bandpass', a: 0.12, hold: 0.1, rel: 0.55 });
    },
    cave() {
      tone(55, 1.4, 'sine', 0.045, sfxBus, { a: 0.35, hold: 0.4, rel: 0.7, cut: 220 });
      burst(1.2, 0.03, sfxBus, { cut: 280, Q: 0.4, filter: 'lowpass', a: 0.25, hold: 0.3, rel: 0.7 });
    },
    splash() {
      burst(0.55, 0.16, sfxBus, { cut: 900, cutTo: 2800, Q: 0.7, filter: 'bandpass', a: 0.005, hold: 0.05, rel: 0.45 });
      tone(220, 0.5, 'triangle', 0.07, sfxBus, { a: 0.01, slide: 110, rel: 0.4, cut: 1200 });
      burst(0.3, 0.06, sfxBus, { delay: 0.08, cut: 3200, Q: 1.2, filter: 'highpass' });
    },
    fire() {
      // 短促噼啪，炼丹循环里反复调用
      burst(0.08 + Math.random() * 0.06, 0.04 + Math.random() * 0.03, sfxBus, {
        cut: 900 + Math.random() * 1400, Q: 1.5 + Math.random(), filter: 'bandpass', a: 0.001, rel: 0.07
      });
    },
    boom() {
      burst(0.9, 0.28, sfxBus, { cut: 180, cutTo: 60, Q: 0.6, filter: 'lowpass', a: 0.005, hold: 0.08, rel: 0.75 });
      tone(48, 1.1, 'sine', 0.18, sfxBus, { a: 0.01, hold: 0.1, rel: 0.9, cut: 200 });
      burst(0.45, 0.1, sfxBus, { delay: 0.05, cut: 1400, Q: 0.8, filter: 'bandpass', a: 0.01, rel: 0.4 });
    },
    gavel() {
      tone(180, 0.12, 'triangle', 0.1, sfxBus, { a: 0.001, hold: 0.02, rel: 0.09, cut: 900, Q: 1.2 });
      burst(0.1, 0.08, sfxBus, { cut: 1100, Q: 1.8, filter: 'bandpass', a: 0.001, rel: 0.08 });
      tone(140, 0.1, 'triangle', 0.06, sfxBus, { delay: 0.09, a: 0.001, hold: 0.015, rel: 0.07, cut: 800 });
    },
    clash() {
      burst(0.22, 0.12, sfxBus, { cut: 2200, cutTo: 600, Q: 1.4, filter: 'bandpass', a: 0.002, hold: 0.02, rel: 0.18 });
      tone(520, 0.18, 'sawtooth', 0.045, sfxBus, { a: 0.002, slide: 180, rel: 0.15, cut: 1600, Q: 2 });
      tone(260, 0.25, 'triangle', 0.05, sfxBus, { delay: 0.02, a: 0.002, rel: 0.2, cut: 900 });
    },
    gold() {
      [523.25, 659.25, 783.99].forEach((f, i) => tone(f, 0.9, 'sine', 0.045 - i * 0.008, sfxBus, {
        delay: i * 0.05, a: 0.02, hold: 0.1, rel: 0.75, cut: 2400
      }));
    },
    fail() {
      tone(196, 0.55, 'triangle', 0.07, sfxBus, { a: 0.02, slide: 98, rel: 0.45, cut: 700 });
      burst(0.4, 0.05, sfxBus, { cut: 500, Q: 0.5, filter: 'lowpass', a: 0.02, rel: 0.35 });
    },
    ink() {
      burst(0.5, 0.04, sfxBus, { cut: 900, cutTo: 400, Q: 0.5, filter: 'lowpass', a: 0.08, hold: 0.1, rel: 0.35 });
      tone(110, 0.7, 'sine', 0.025, sfxBus, { a: 0.1, hold: 0.15, rel: 0.5, cut: 500 });
    },
  };

  function play(name) {
    if (!unlocked || pref.muted || hidden || reduced() && name === 'drip') return;
    ensure();
    if (!ctx) return;
    const fn = SFX[name]; if (fn) fn();
  }

  function uiTap() {
    const now = performance.now();
    if (now - uiLast < 90) return;
    uiLast = now;
    play('drip');
  }

  /* ---------- Ambient ---------- */
  const PENTA = [196.0, 220.0, 261.63, 293.66, 329.63, 392.0, 440.0]; // G A C D E
  const PENTA_YU = [174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0]; // 羽调略沉
  const PENTA_ZHI = [220.0, 246.94, 293.66, 329.63, 392.0, 440.0, 493.88]; // 徵调略亮

  function stopNodes(list) {
    for (const n of list) {
      try {
        if (n.gain) { const t = ctx.currentTime; n.gain.gain.cancelScheduledValues(t); n.gain.gain.setValueAtTime(n.gain.gain.value, t); n.gain.gain.linearRampToValueAtTime(0.0001, t + 0.6); }
        if (n.src && n.src.stop) setTimeout(() => { try { n.src.stop(); } catch (e) {} }, 700);
        if (n.osc && n.osc.stop) setTimeout(() => { try { n.osc.stop(); } catch (e) {} }, 700);
        if (n.timer) clearInterval(n.timer);
      } catch (e) {}
    }
    list.length = 0;
  }

  function makeNoiseLoop(cut, peak, type = 'lowpass', Q = 0.5) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf(2.5); src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = cut; f.Q.value = Q;
    const g = ctx.createGain(); g.gain.value = 0.0001;
    src.connect(f); f.connect(g); g.connect(amb.gain);
    src.start();
    const t = ctx.currentTime;
    g.gain.linearRampToValueAtTime(peak, t + 1.2);
    return { src, gain: g, filter: f };
  }

  function schedulePluck(busGain, rate) {
    const tick = () => {
      if (!unlocked || pref.muted || hidden || amb.mode === 'off' || !ctx) return;
      const scale = (amb.season === 3) ? PENTA_YU : (amb.mode === 'title' ? PENTA_ZHI : PENTA);
      const f = scale[(Math.random() * scale.length) | 0] * (Math.random() < 0.25 ? 0.5 : 1);
      const peak = 0.024 + Math.random() * 0.026;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2.01;
      const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 1400 + Math.random() * 800;
      const g = ctx.createGain();
      const g2 = ctx.createGain(); g2.gain.value = 0.22;
      o.connect(flt); o2.connect(g2); g2.connect(flt); flt.connect(g); g.connect(busGain);
      env(g, 0.012, peak, 0.1, 2.6 + Math.random() * 1.6, t0);
      o.start(t0); o2.start(t0); o.stop(t0 + 4.8); o2.stop(t0 + 4.8);
      // 偶发泛音余响
      if (Math.random() < 0.35) {
        const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 3.01;
        const g3 = ctx.createGain();
        o3.connect(g3); g3.connect(busGain);
        env(g3, 0.02, peak * 0.35, 0.05, 1.8, t0 + 0.35);
        o3.start(t0 + 0.35); o3.stop(t0 + 3.2);
      }
    };
    tick();
    return setInterval(tick, rate);
  }

  function rebuildAmbient() {
    if (!ctx || !unlocked) return;
    if (!amb.gain) { amb.gain = ctx.createGain(); amb.gain.gain.value = 1; amb.gain.connect(ambBus); }
    stopNodes(amb.nodes);
    if (amb.fire) { clearInterval(amb.fire); amb.fire = null; }
    if (pref.muted || hidden || amb.mode === 'off') return;

    const mode = amb.mode, place = amb.place, season = amb.season | 0;
    // 古琴疏音
    if (mode === 'title' || mode === 'main' || mode === 'map') {
      const rate = mode === 'title' ? 5200 : mode === 'map' ? 6400 : 4800;
      amb.nodes.push({ timer: schedulePluck(amb.gain, rate) });
      // 极淡持续底音
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mode === 'title' ? 98 : 82;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      o.connect(g); g.connect(amb.gain); o.start();
      g.gain.linearRampToValueAtTime(mode === 'title' ? 0.018 : 0.012, ctx.currentTime + 2);
      amb.nodes.push({ osc: o, gain: g });
    }

    // 风
    let wind = 0.018, windCut = 380;
    if (place === 'beihai' || place === 'yunhai') { wind = 0.045; windCut = 520; }
    else if (place === 'xihuang') { wind = 0.038; windCut = 700; }
    else if (place === 'heifeng') { wind = 0.032; windCut = 450; }
    else if (season === 3) { wind = 0.028; windCut = 400; }
    else if (season === 1) { wind = 0.014; }
    if (mode === 'map' || mode === 'main' || mode === 'title') {
      const w = makeNoiseLoop(windCut, wind, 'bandpass', 0.7);
      amb.nodes.push(w);
      // 缓缓摆动
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ctx.createGain(); lg.gain.value = wind * 0.45;
      lfo.connect(lg); lg.connect(w.gain.gain); lfo.start();
      amb.nodes.push({ osc: lfo, gain: lg });
    }

    // 雨：春夏
    if ((season === 0 || season === 1) && (mode === 'main' || mode === 'map' || mode === 'title') && place !== 'xihuang' && place !== 'beihai') {
      const rain = makeNoiseLoop(3200, season === 0 ? 0.022 : 0.016, 'highpass', 0.4);
      amb.nodes.push(rain);
      const dripTimer = setInterval(() => {
        if (pref.muted || hidden) return;
        if (Math.random() > 0.55) burst(0.05, 0.012, amb.gain, { cut: 4000 + Math.random() * 2000, Q: 3, filter: 'bandpass', a: 0.001, rel: 0.04 });
      }, 420);
      amb.nodes.push({ timer: dripTimer });
    }
    // 秋：虫鸣疏点
    if (season === 2 && (mode === 'main' || mode === 'map' || mode === 'title') && place !== 'beihai' && place !== 'xuewu') {
      const bugTimer = setInterval(() => {
        if (pref.muted || hidden) return;
        if (Math.random() > 0.4) {
          tone(2400 + Math.random() * 1800, 0.04 + Math.random() * 0.05, 'square', 0.006 + Math.random() * 0.006, amb.gain, {
            a: 0.001, hold: 0.008, rel: 0.03, cut: 5000, Q: 4, filter: 'bandpass'
          });
        }
      }, 900);
      amb.nodes.push({ timer: bugTimer });
    }
    // 冬：更干的风砂底
    if (season === 3 && (mode === 'main' || mode === 'map') && place !== 'xuewu') {
      const dry = makeNoiseLoop(600, 0.012, 'bandpass', 0.5);
      amb.nodes.push(dry);
    }
    // 洞府／闭关感：main + 无特殊地名时极淡水滴
    if (mode === 'main' && !place) {
      const caveDrip = setInterval(() => {
        if (pref.muted || hidden) return;
        if (Math.random() > 0.7) burst(0.08, 0.008, amb.gain, { cut: 2800, Q: 2.5, filter: 'bandpass', a: 0.002, rel: 0.06 });
      }, 2800);
      amb.nodes.push({ timer: caveDrip });
    }

    // 血雾谷：不安低鸣
    if (place === 'xuewu' && (mode === 'map' || mode === 'main')) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 46;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      o.connect(f); f.connect(g); g.connect(amb.gain); o.start();
      g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1.5);
      amb.nodes.push({ osc: o, gain: g });
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 69.5;
      const g2 = ctx.createGain(); g2.gain.value = 0.0001;
      o2.connect(g2); g2.connect(amb.gain); o2.start();
      g2.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 2);
      amb.nodes.push({ osc: o2, gain: g2 });
    }

    // 北海寒意
    if (place === 'beihai' && (mode === 'map' || mode === 'main')) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 61;
      const g = ctx.createGain(); g.gain.value = 0.0001;
      o.connect(g); g.connect(amb.gain); o.start();
      g.gain.linearRampToValueAtTime(0.016, ctx.currentTime + 2);
      amb.nodes.push({ osc: o, gain: g });
    }

    // 拍卖：夜场木鱼底
    if (mode === 'auction') {
      const w = makeNoiseLoop(220, 0.025, 'lowpass', 0.4);
      amb.nodes.push(w);
      const timer = setInterval(() => {
        if (pref.muted || hidden) return;
        tone(98, 1.8, 'sine', 0.02, amb.gain, { a: 0.4, hold: 0.3, rel: 1.1, cut: 400 });
      }, 7000);
      amb.nodes.push({ timer });
    }

    // 炼丹：炉火噼啪
    if (mode === 'dan') {
      const w = makeNoiseLoop(900, 0.03, 'bandpass', 0.9);
      amb.nodes.push(w);
      amb.fire = setInterval(() => { if (!pref.muted && !hidden) SFX.fire(); }, 280);
    }
  }

  function startAmbient(mode) {
    amb.mode = mode || 'off';
    if (!unlocked) return;
    ensure();
    rebuildAmbient();
  }

  function setPlace(id, season) {
    amb.place = id || null;
    if (season != null) amb.season = season;
    if (unlocked) rebuildAmbient();
  }

  function setSeason(s) {
    amb.season = s | 0;
    if (unlocked && (amb.mode === 'main' || amb.mode === 'map' || amb.mode === 'title')) rebuildAmbient();
  }

  function setMuted(m) {
    pref.muted = !!m; save(); applyGain(false);
    if (!pref.muted && unlocked) rebuildAmbient();
    else stopNodes(amb.nodes);
    syncUI();
  }

  function setVol(v) {
    pref.vol = Math.max(0, Math.min(1, +v || 0));
    if (pref.vol <= 0.001) pref.muted = true;
    else if (pref.muted && pref.vol > 0) pref.muted = false;
    save(); applyGain(false); syncUI();
  }

  function syncUI() {
    const btn = document.getElementById('btn-audio');
    const slider = document.getElementById('audio-vol');
    if (btn) {
      btn.classList.toggle('muted', !!pref.muted || !unlocked);
      btn.setAttribute('aria-pressed', pref.muted ? 'true' : 'false');
      btn.title = !unlocked ? '轻触开卷以启声' : (pref.muted ? '启声' : '静音');
      const lab = btn.querySelector('.audio-lab');
      if (lab) lab.textContent = !unlocked ? '声' : (pref.muted ? '静' : '声');
    }
    if (slider) {
      slider.value = String(Math.round(pref.vol * 100));
      slider.disabled = !!pref.muted && pref.vol <= 0;
    }
  }

  function mountUI() {
    if (document.getElementById('audio-dock')) return;
    const dock = document.createElement('div');
    dock.id = 'audio-dock';
    dock.innerHTML = `<button type="button" id="btn-audio" class="audio-btn muted" aria-label="音效" aria-pressed="true" title="轻触开卷以启声"><span class="audio-lab">声</span></button>
      <input type="range" id="audio-vol" class="audio-vol" min="0" max="100" value="${Math.round(pref.vol * 100)}" aria-label="音量">`;
    document.body.appendChild(dock);
    const btn = dock.querySelector('#btn-audio');
    const slider = dock.querySelector('#audio-vol');
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const was = unlocked;
      await unlock();
      if (!unlocked) return;
      if (!was && pref.muted) setMuted(false);   // 首次点开关 = 启声
      else setMuted(!pref.muted);
      if (!pref.muted) play('drip');
    });
    slider.addEventListener('input', async () => {
      await unlock();
      setVol(+slider.value / 100);
    });
    syncUI();
  }

  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    applyGain(false);
    if (hidden) stopNodes(amb.nodes);
    else if (unlocked && !pref.muted) rebuildAmbient();
  });

  // 首次手势解锁（开卷等）
  const unlockOnce = async () => { await unlock(); syncUI(); };
  ['pointerdown', 'touchstart', 'keydown'].forEach(ev =>
    document.addEventListener(ev, unlockOnce, { once: true, capture: true, passive: true }));

  global.MoAudio = {
    unlock, play, uiTap, startAmbient, setPlace, setSeason,
    setMuted, setVol, isMuted: () => !!pref.muted, isUnlocked: () => unlocked,
    vol: () => pref.vol, mountUI, syncUI,
  };
})(typeof window !== 'undefined' ? window : globalThis);
