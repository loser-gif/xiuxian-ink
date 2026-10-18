/* 墨仙录 · 活墨：一个共享 WebGL 着色器，渲染会呼吸、会洇开的湿墨（按钮墨团）与全屏墨染（转场/破境） */
'use strict';
const InkGL = (() => {
  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => !!(RM && RM.matches);
  const NOISE = `
    precision highp float;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
    float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 4; i++){ v += a * noise(p); p = m * p; a *= .5; } return v; }
    float fbm3(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 3; i++){ v += a * noise(p); p = m * p; a *= .5; } return v; }
    // 宣纸纤维：两组被拉长的噪声，取最大值，得到细长交错的纤维走向
    float fibre(vec2 p){
      vec2 a = mat2(.8, .6, -.6, .8) * p, b = mat2(.4, -.9, .9, .4) * p;
      return max(noise(a * vec2(30., 3.)), noise(b * vec2(3., 34.)));
    }`;
  const VERT = `attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

  // ---- 按钮墨团：笔触(kind 0) / 圆墨(kind 1)
  const BLOT_FRAG = NOISE + `
    varying vec2 vUv;
    uniform vec2 uRes; uniform float uTime, uSeed, uKind, uAlpha, uSurge, uSheen; uniform vec3 uInk;
    void main(){
      float A = uRes.x / uRes.y;
      vec2 p = vec2((vUv.x - .5) * A, vUv.y - .5);
      float t = uTime;
      // 低频域扭曲：墨在湿纸上缓慢蠕动、呼吸
      vec2 q = p + (vec2(fbm3(p * 1.7 + vec2(uSeed, t * .035)), fbm3(p * 1.7 + vec2(uSeed + 5.2, -t * .03))) - .5) * .16;
      float d, tt = 0., cy = 0.;
      if (uKind < .5) {
        float x0 = -A * .35, x1 = A * .41;
        tt = clamp((q.x - x0) / (x1 - x0), 0., 1.);
        cy = .03 * sin(tt * 2.6 + uSeed) - .012 + .05 * tt * tt;          // 笔势略向上挑
        float th = .2 * (1. - .3 * tt) * (.92 + .16 * fbm3(vec2(tt * 3., uSeed))) * (1. - smoothstep(.7, 1.02, tt)) + .004;
        float th0 = .2 * (.92 + .16 * fbm3(vec2(0., uSeed)));
        if (q.x < x0) d = length(vec2((q.x - x0) * 1.25, q.y - cy)) - th0;  // 圆润起笔
        else d = abs(q.y - cy) - th;
        d -= .035 * smoothstep(.16, 0., tt);                                 // 起笔按压，略肥
        d += (fbm(q * vec2(5., 9.) + uSeed) - .5) * .06 + (noise(q * 46. + uSeed) - .5) * .01;  // 毛边
      } else {
        d = length(q) - .3 + (fbm(q * 2.2 + uSeed) - .5) * .2;
      }
      d -= .008 * sin(t * .55 + uSeed * 3.) + uSurge * .07;  // 呼吸 + 按下时墨势外涌
      // 洇：沿纸纤维向外渗，渗出量随时间缓慢起伏
      float fib = fibre(p * 1.4 + uSeed);
      float creep = .55 + .45 * sin(t * .16 + fbm3(p * 2.5 + uSeed) * 6.28);
      float bleed = smoothstep(.06 + .07 * creep + uSurge * .05, 0., d - fib * .03) * (.18 + .22 * fib);
      // 墨芯：边缘清晰，内部有积墨浓淡
      float core = 1. - smoothstep(-.012, .008, d);
      float inner = .93 + .07 * fbm(p * 3.6 + vec2(uSeed, t * .02));
      float rim = exp(-pow((d + .012) / .012, 2.)) * .12 * (.5 + fbm3(p * 8. + uSeed));  // 墨聚于边，深浅不一
      // 飞白：笔尾出现干笔丝缕
      float sk = noise(vec2(q.x * 3.2, q.y * 38. + fbm3(q * 4.) * 6.) + uSeed) * (.7 + .5 * noise(vec2(q.x * 9., q.y * 3.) + uSeed));
      float dry = smoothstep(.3 + .35 * tt, .55 + .35 * tt, sk);
      core *= mix(1., dry, smoothstep(.55, .95, tt) * (1. - uKind));
      float a = max(core * inner + rim * core, bleed);
      // 尾端偶尔甩出一粒小墨点
      float P = 9.;
      float ph = fract(t / P + uSeed * .137);
      vec2 tip = uKind < .5 ? vec2(A * .35, cy + .02) : vec2(.24 * cos(uSeed * 7.), .24 * sin(uSeed * 7.));
      vec2 dir = uKind < .5 ? vec2(.9, .35) : normalize(tip);
      vec2 dp = tip + dir * (.02 + ph * .1);
      float dr = .022 * (1. - ph * .45);
      float drop = (1. - smoothstep(dr * .55, dr, length(p - dp) + (noise(p * 60.) - .5) * .006))
                   * smoothstep(0., .06, ph) * (1. - smoothstep(.55, .95, ph)) * step(.45, fract(uSeed * 3.7 + floor(t / P) * .618));
      a = max(a, drop * .9);
      // 湿光：一道极淡的高光缓缓滑过墨面
      float sx = (fract(t * .045 + uSeed * .3) * 1.8 - .9) * A;
      float sh = exp(-pow((p.x + p.y * .7 - sx) / (.16 * A), 2.)) * core * (.45 + .55 * fbm3(p * 5. + t * .05)) * uSheen;
      vec3 col = mix(uInk, uInk + vec3(.30, .29, .27), sh * .35);
      a *= uAlpha * smoothstep(0., .07, vUv.x) * smoothstep(1., .93, vUv.x) * smoothstep(0., .1, vUv.y) * smoothstep(1., .9, vUv.y);
      gl_FragColor = vec4(col * a, a);
    }`;

  // ---- 全屏墨染：mode 0 = 转场（纸面自中心洇开，墨晕为边），mode 1 = 破境（浓墨洇满全屏）
  const SPREAD_FRAG = NOISE + `
    varying vec2 vUv;
    uniform vec2 uRes, uC; uniform float uTime, uK, uMode, uSeed; uniform vec3 uInk, uPaper; uniform sampler2D uTex; uniform vec2 uTexScale;
    void main(){
      vec2 px = vUv * uRes;
      vec2 p = (px - uC) / uRes.y;
      float R = uK * (length(uRes) / uRes.y) * 1.08;
      vec2 w = vec2(fbm(p * 2.4 + vec2(uSeed, uTime * .1)), fbm(p * 2.4 + vec2(uSeed + 4.1, -uTime * .1))) - .5;
      float d = length(p + w * .22) - R + (fbm(p * 7. + uSeed) - .5) * .06;
      float fib = fibre(p * 1.2 + uSeed);
      if (uMode < .5) {
        float paper = 1. - smoothstep(-.01, .015, d + fib * .02);
        float fringe = exp(-pow((d - .03) / .05, 2.)) * (.45 + .4 * fib) * (1. - smoothstep(.85, 1., uK));
        vec3 tex = texture2D(uTex, vUv * uTexScale).rgb;
        float a = max(paper, fringe);
        vec3 col = mix(uInk, tex, paper / max(a, .001));
        gl_FragColor = vec4(col * a, a);
      } else {
        float core = 1. - smoothstep(-.02, .03, d);
        float bleed = (1. - smoothstep(0., .09 + .05 * fib, d)) * .55;
        float inner = .93 + .07 * fbm(p * 2.5 + uTime * .03);
        float rim = exp(-pow((d + .03) / .025, 2.)) * .12;
        float a = clamp(max(core * inner + rim, bleed), 0., 1.);
        gl_FragColor = vec4(uInk * a, a);
      }
    }`;


  // ---- 吐纳：淡墨云气自卷底山影与两侧被吸入，旋成一笔圆相，随即沉入纸中
  const QI_FRAG = NOISE + `
    varying vec2 vUv;
    uniform vec2 uRes, uC; uniform float uT, uSeed, uR;
    vec3 INK = vec3(.09, .085, .08), INDIGO = vec3(.20, .23, .32);
    void main(){
      vec2 px = vUv * uRes;
      vec2 p = (px - uC) / uRes.y;                 // 以卷高为单位，圆心为原点
      float t = uT;
      float g = smoothstep(0., 1.05, t);            // 吸：0→1.05s
      float e = smoothstep(.5, 1.12, t);            // 圆相落笔
      float s = smoothstep(1.08, 1.75, t);          // 沉：墨被纸吸走
      // 域扭曲：云气不是点，是被水流牵动的一缕淡墨
      float r0 = length(p);
      float rip0 = uR + smoothstep(1.08, 1.75, t) * .42;
      if (t > 1.2 && abs(r0 - uR) > .32 && abs(r0 - rip0) > .14) { gl_FragColor = vec4(0.); return; }
      if (t < .5 && r0 < uR * .45) { gl_FragColor = vec4(0.); return; }
      vec2 w = vec2(fbm3(p * 3.2 + vec2(uSeed, t * .35)), fbm3(p * 3.2 + vec2(uSeed + 4.1, -t * .3))) - .5;
      vec2 q = p + w * (.09 + .05 * (1. - g));
      float r = length(q), th = atan(q.y, q.x);
      float lr = log(max(r, .02));
      // 两缕螺旋：随吸气向圆心收拢、旋转
      float phi = th * 2. - lr * 3.4 - t * 2.6 + uSeed;
      float band = pow(.5 + .5 * sin(phi + w.x * 5.), 10.);
      float band2 = pow(.5 + .5 * sin(phi * .5 + 1.7 + w.y * 6.), 12.) * .6;   // 一缕更细的游丝
      // 沿流向的浓淡起伏，向内流动
      float stream = smoothstep(.25, .75, fbm3(vec2(phi * .35, lr * 2.6 + t * 3.2) + uSeed));
      float Rout = mix(1.25, uR * 1.05, g * g);     // 云气外缘随吸气收缩
      float env = smoothstep(Rout + .14, Rout - .06, r) * smoothstep(uR * .55, uR * 1.02, r);
      // 自下方山影升起的那一缕更浓
      env *= .55 + .45 * smoothstep(.15, -.45, p.y) + .25 * smoothstep(.0, -.2, p.y);
      float smoke = max(band, band2) * (.35 + .65 * stream) * env;
      smoke *= smoothstep(0., .28, t) * (1. - smoothstep(.85, 1.2, t));         // 入、化为圆相
      // 圆相：一笔，起笔浓、收笔飞白，留一缺口
      float th0 = -2.2 + uSeed * .3;
      float a = fract((atan(p.y, p.x) - th0) / 6.2832);                          // 起笔处 a=0，顺时针
      a = 1. - a;
      float rr = length(p + w * .025);
      float bw = mix(.020, .007, a) * (1. + .35 * (fbm3(vec2(a * 6., uSeed)) - .5)) * (1. + s * 2.4);
      float ringR = uR * (1. + .015 * sin(a * 9. + uSeed) + s * .08);
      float ring = exp(-pow((rr - ringR) / bw, 2.));
      float dry = smoothstep(.25, .6, noise(vec2(a * 70., (rr - ringR) / bw * 1.6) + uSeed));
      ring *= mix(1., dry, smoothstep(.55, .92, a));
      ring *= smoothstep(e * .94 + .015 + s * .06, e * .94 - .02 - s * .14, a);                       // 笔锋随时间行进
      ring *= smoothstep(0., .03 + s * .08, a);
      // 沉入：墨沿纸纤维洇开、变淡
      float fib = fibre(p * 2.4 + uSeed);
      float bleed = exp(-pow((rr - ringR) / (bw * (2.2 + fib * 1.5)), 2.)) * s * (1. - s) * .9 * smoothstep(.98, .8, a) * smoothstep(0., .06, a);
      float enso = (ring * (1. - s * .92) + bleed * .5) * smoothstep(1.75, 1.5, t + .0001) ;
      // 纸色微漾：一圈极淡的墨痕自圆相向外荡开（呼）
      float rip = exp(-pow((r - (uR + s * .42)) / (.025 + s * .03), 2.)) * s * (1. - s) * .22;
      float A = smoke * .26 + enso * .52 + rip;
      A *= 1. - smoothstep(1.6, 1.8, t);
      vec3 col = mix(INDIGO, INK, clamp(enso * 1.4 + smoke * .4, 0., 1.));
      gl_FragColor = vec4(col * A, A);
    }`;


  // ---- 丹炉：鼎为纹理；炉火是朱砂赭石的水色洇染，烟是卷曲的淡墨游丝
  // uState: 0 炼 / 1 成 / 2 上品 / 3 炸炉 / 4 废丹；uK 为当前状态经过的秒数
  const FURNACE_FRAG = NOISE + `
    varying vec2 vUv;
    uniform vec2 uRes; uniform float uT, uK, uState, uSeed, uD; uniform sampler2D uDing;
    vec3 INK = vec3(.106, .094, .078), ZHU = vec3(.70, .19, .13), ZHE = vec3(.80, .50, .22), JIN = vec3(.78, .58, .24), ASH = vec3(.36, .34, .31);
    void over(inout vec4 acc, vec3 c, float a){ a = clamp(a, 0., 1.); acc = vec4(c * a, a) + acc * (1. - a); }
    void main(){
      float A = uRes.x / uRes.y;
      vec2 p = vec2((vUv.x - .5) * A, vUv.y - .5);
      float t = uT, k = uK;
      bool fire = uState < .5, ok = uState > .5 && uState < 2.5, gold = uState > 1.5 && uState < 2.5, boom = uState > 2.5 && uState < 3.5, waste = uState > 3.5;
      // 火势：炼时满，成丹后渐收为余温，炸炉瞬灭，废丹缓熄
      float heat = fire ? smoothstep(0., .9, k) : ok ? 1. - .82 * smoothstep(0., 1.4, k) : boom ? 1. - smoothstep(0., .12, k) : 1. - smoothstep(0., 1.6, k);
      float D = uD;                                   // 鼎在画布中的尺寸（以画布高为 1）
      vec2 mouth = vec2(0., D * .148), base = vec2(0., -D * .24);
      // 炸炉：鼎身一震
      vec2 shake = boom ? vec2(sin(k * 71.), cos(k * 53.)) * .012 * (1. - smoothstep(0., .45, k)) : vec2(0.);
      vec4 acc = vec4(0.);
      float fib = fibre(p * 2.6 + uSeed);
      // ---- 炉温：极淡的赭色水晕，自鼎足间向四周洇开
      vec2 fb = vec2(0., -D * .36);
      vec2 hq = (p - fb - vec2(0., D * .08)) * vec2(1.05, 1.5);
      float halo = exp(-dot(hq, hq) / (D * D) * 3.2) * (.7 + .3 * sin(t * 1.3 + fbm3(p * 3. + t * .2) * 3.));
      halo *= (.8 + .4 * fib);
      over(acc, mix(ZHE, ZHU, .2), halo * .26 * heat);
      // ---- 炉火：水色火舌，自三足间升起，绕鼎腹两侧向上舔舐
      vec2 q = p - fb;
      float rise = t * .8;
      float n1 = fbm(vec2(q.x * 6.5 / (D * 2.), q.y * 4.2 / (D * 2.) - rise) + uSeed), n2 = fbm(vec2(q.x * 13. / (D * 2.) + 3.1, q.y * 8. / (D * 2.) - rise * 1.6) + uSeed * 2.);
      float wy = clamp(q.y / (D * .62), 0., 1.);
      float hw = mix(D * .5, D * .08, pow(wy, .9));
      float env = smoothstep(hw, hw * .2, abs(q.x + (n1 - .5) * D * .16)) * smoothstep(-D * .12, D * .05, q.y + (n2 - .5) * D * .08) * (1. - smoothstep(D * .3, D * .62, q.y + (n2 - .5) * D * .24));
      float fl = clamp(env * (n1 * 1.45 - .22 + n2 * .45) * (.85 + .25 * sin(t * 2.3 + n1 * 4.)), 0., 1.);
      float pool = exp(-pow((fl - .3) / .06, 2.)) * .4;                      // 水色积于边
      vec3 fcol = mix(mix(ZHE, vec3(.86, .66, .38), .35), ZHU, smoothstep(.2, .8, fl));
      fcol = mix(fcol, vec3(.5, .13, .08), pool);
      float fa = (smoothstep(.04, .75, fl) * .66 + pool * .4 + smoothstep(.02, .2, fl) * fib * .16) * heat;
      over(acc, fcol, fa);
      // 火星：几粒朱砂随热气升起
      vec2 sg = vec2(p.x * 26., p.y * 16. - t * 2.2);
      vec2 cell = floor(sg), fr = fract(sg) - .5;
      float h = hash(cell + uSeed);
      vec2 jit = vec2(hash(cell + 7.1), hash(cell + 3.3)) - .5;
      float spark = smoothstep(.13, .03, length(fr - jit * .6)) * step(.9, h) * smoothstep(-.32, -.14, p.y) * (1. - smoothstep(-.02, .14, p.y)) * smoothstep(D * .55, D * .2, abs(p.x));
      over(acc, ZHU, spark * .75 * heat);
      // ---- 鼎
      vec2 du = (p - shake) / D + .5;
      vec4 dc = vec4(0.);
      if (du.x > 0. && du.x < 1. && du.y > 0. && du.y < 1.) dc = texture2D(uDing, vec2(du.x, 1. - du.y));
      vec3 dcol = dc.a > .001 ? dc.rgb / dc.a : vec3(0.);
      // 火光映在鼎腹下沿；炸炉后鼎身熏黑
      float lit = heat * smoothstep(.62, .2, du.y) * .32 * (.7 + .3 * sin(t * 2.1));
      dcol = mix(dcol, mix(dcol, vec3(.62, .22, .12), .55), lit);
      if (boom) dcol = mix(dcol, INK * .9, .45 * smoothstep(.05, .35, k));
      over(acc, dcol, dc.a);
      float n3 = fbm(vec2(q.x * 9. / (D * 2.) + 7.3, q.y * 6. / (D * 2.) - rise * 1.3) + uSeed * 3.);
      float front = env * smoothstep(.45, .85, n3 + n1 * .3) * (1. - smoothstep(D * .1, D * .26, q.y + (n2 - .5) * D * .12));
      over(acc, mix(ZHE, ZHU, .5), front * .42 * heat);
      // ---- 烟：自鼎口升起的三缕淡墨，卷曲、断续、渐散
      float hy = p.y - mouth.y;
      float smokeAmt = fire ? .55 * smoothstep(.2, 1.4, k) : ok ? .55 * (1. - smoothstep(.0, 1.8, k)) : boom ? .9 * smoothstep(.05, .35, k) * (1. - smoothstep(2.4, 5., k)) : .85 * (1. - smoothstep(1.5, 4.5, k));
      vec3 scol = waste || boom ? mix(INK, ASH, .35) : mix(INK, ASH, .55);
      float sm = 0.;
      for (int i = 0; i < 3; i++) {
        float fi = float(i), ph = fi * 2.17 + uSeed;
        float sp = waste || boom ? 1.35 : 1.;
        float cx = (fi - 1.) * D * .07 * (1. + hy * 3.) + sin(hy * 10. - t * 1.25 * sp + ph) * .028 * smoothstep(0., .14, hy) * (1. + hy * 2.)
                 + (fbm3(vec2(hy * 3.4 - t * .35, ph)) - .5) * .2 * hy;
        float w = (.006 + hy * .075) * (waste || boom ? 1.7 : 1.);
        float band = exp(-pow((p.x - cx) / w, 2.));
        float life = smoothstep(-.005, .04, hy) * (1. - smoothstep(.12, .44 - fi * .03, hy));
        float brk = smoothstep(.32, .68, fbm(vec2(p.x * 9. + ph, hy * 6.5 - t * .95 * sp)));
        sm += band * life * brk * (.62 - fi * .14);
      }
      over(acc, scol, sm * smokeAmt * .5);
      // ---- 成丹：金赭色的水晕自鼎口晕开，一粒丹丸浮起
      if (ok) {
        vec2 c0 = p - mouth - vec2(0., .02);
        float r = length(c0 * vec2(1., 1.15));
        float kk = smoothstep(0., 2.2, k);
        float R1 = .05 + kk * (gold ? .36 : .27);
        float ring = exp(-pow((r - R1 + (fbm3(c0 * 7. + uSeed) - .5) * .03) / (.018 + .05 * kk), 2.)) * (1. - kk) * (gold ? .5 : .32);
        float disc = exp(-r * r / (.005 + .07 * kk)) * (gold ? .5 : .34) * (1. - .3 * kk) * smoothstep(0., .25, k);
        vec3 bc = gold ? JIN : mix(ZHE, JIN, .3);
        over(acc, bc, (ring + disc) * (.8 + .4 * fib));
        // 丹丸
        float py = mouth.y + .03 + smoothstep(.15, 1.3, k) * .12 + sin(t * 1.6) * .005 * smoothstep(1., 1.6, k);
        vec2 pp = p - vec2(0., py);
        float pr = D * .05 * (1. + (fbm3(pp * 60. + uSeed) - .5) * .12);
        float pl = length(pp);
        float pill = smoothstep(pr, pr * .8, pl) * smoothstep(.1, .5, k);
        float glow = exp(-dot(pp, pp) / (pr * pr * 9.)) * (gold ? .55 : .4) * smoothstep(.1, .6, k);
        if (gold) {                                                          // 金屑：丹纹自生，缓缓升散
          vec2 g = vec2(p.x * 30., p.y * 22. - t * .9);
          float hg = hash(floor(g) + uSeed + 2.);
          float fl2 = smoothstep(.16, .04, length(fract(g) - .5 - (vec2(hash(floor(g) + .3), hash(floor(g) + .8)) - .5) * .5)) * step(.93, hg);
          float zone = exp(-dot(p - mouth - vec2(0., .1), p - mouth - vec2(0., .1)) / (D * D * .09)) * smoothstep(.3, 1.2, k);
          over(acc, JIN, fl2 * zone * .8);
        }
        vec3 pc = gold ? mix(ZHU, JIN, .45) : ZHU;
        over(acc, gold ? JIN : ZHE, glow);
        pc = mix(pc, vec3(.98, .9, .78), smoothstep(pr * .6, 0., length(pp - vec2(-pr * .35, pr * .35))) * .55);
        pc = mix(pc, vec3(.42, .1, .06), smoothstep(pr * .62, pr * .95, pl) * .5);   // 边缘积色
        over(acc, pc, pill);
      }
      // ---- 炸炉：黑烟自鼎口冲起，墨团翻卷、边缘积墨，渐散为淡灰；墨点四溅，火屑飞散
      if (boom) {
        float kk = 1. - pow(1. - min(k * 1.6, 1.), 3.);
        float settle = mix(.92, .5, smoothstep(.4, 3., k));
        // 烟团：自口沿向上翻起的几团墨
        float plume = 0.;
        for (int i = 0; i < 4; i++) {
          float fi = float(i);
          vec2 cc = mouth + vec2((hash(vec2(fi, uSeed)) - .5) * D * .46, D * (.1 + fi * .1) * kk + k * .012);
          float rr = D * (.16 + .045 * fi) * (.35 + .65 * kk) * (1. + .12 * k);
          vec2 d = (p - cc) / rr; d.y *= 1.15;
          float e = length(d) + (fbm(p * 6. / D + vec2(fi * 3.7, -t * .25) + uSeed) - .5) * .7;
          plume = max(plume, (1. - smoothstep(.72, 1., e)) * (1. - fi * .1));
        }
        // 墨团贴着鼎口收拢，不盖住鼎身
        plume *= smoothstep(mouth.y - D * .1, mouth.y + D * .08, p.y + (fbm3(p * 9. / D) - .5) * D * .1);
        float pe = plume * (1. - plume);                                     // 边缘积墨
        float body = smoothstep(.0, .35, plume) * (.55 + .25 * fbm(p * 11. / D + uSeed + t * .05)) + pe * 1.1;
        over(acc, INK, clamp(body, 0., 1.) * settle);
        // 墨点：直角网格里稀疏落点，大小不一，随气浪由近及远出现
        vec2 c0 = p - mouth;
        float r = length(c0);
        vec2 g = p * 22. / D;
        vec2 gc = floor(g), gf = fract(g) - .5;
        float hh = hash(gc + uSeed + 4.2);
        float rad = .1 + .3 * hash(gc + 9.1);
        float dist = length(gf - (vec2(hash(gc + 1.7), hash(gc + 5.3)) - .5) * .5);
        float drop = smoothstep(rad, rad * .55, dist) * step(.9, hh) * step(D * .28, r) * step(r, D * .78) * step(r, D * .85 * kk + .001);
        over(acc, INK, drop * .8 * settle);
        // 朱砂火屑：迸出后坠落熄灭
        vec2 g2 = vec2(p.x * 14. / D, (p.y + k * k * .06) * 14. / D);
        float h2 = hash(floor(g2) + uSeed + 9.);
        float ember = smoothstep(.18, .05, length(fract(g2) - .5)) * step(.95, h2) * step(D * .2, r) * step(r, D * .7 * kk) * (1. - smoothstep(.4, 1.8, k));
        over(acc, ZHU, ember * .85);
      }
      // ---- 废丹：炉底一摊灰白的余烬
      if (waste) {
        vec2 aq = (p - base) * vec2(1.4, 3.);
        float ash = exp(-dot(aq, aq) * 9.) * smoothstep(.2, 1.4, k) * (.6 + .4 * fbm(p * 12. + uSeed));
        over(acc, ASH, ash * .35);
      }
      // 画布四缘渐隐：任何墨色都不在边上留下硬线
      float edge = smoothstep(.5, .38, abs(p.y)) * smoothstep(A * .5, A * .5 - .1, abs(p.x));
      gl_FragColor = acc * edge;
    }`;

  function mkGL(canvas) {
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true }) ;
    if (!gl) return null;
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    return gl;
  }
  function prog(gl, fs) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const loc = gl.getAttribLocation(p, 'aPos'); const U = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i); U[u.name] = gl.getUniformLocation(p, u.name); }
    return { p, loc, U };
  }
  function draw(gl, P) {
    gl.useProgram(P.p); gl.enableVertexAttribArray(P.loc); gl.vertexAttribPointer(P.loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

  /* ================= 活墨按钮 ================= */
  const B = { gl: null, P: null, list: [], raf: 0, frame: 0, ok: false, t0: performance.now() };
  function initBlots() {
    try {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
      B.gl = mkGL(cv); if (!B.gl) return false;
      B.P = prog(B.gl, BLOT_FRAG); B.ok = true;
    } catch (e) { console.warn('InkGL blot disabled:', e.message); B.ok = false; }
    return B.ok;
  }
  function variant(host) {
    const btn = host.closest('button');
    if (host.classList.contains('act-ink')) return { kind: 1, ink: '#1b1814', alpha: 1, sheen: .5 };
    if (btn && btn.classList.contains('light')) return { kind: 0, ink: '#f3ead6', alpha: .95, sheen: 0 };
    if (btn && (btn.id === 'btn-continue' || (btn.closest('.create-actions') && !btn.classList.contains('primary')))) return { kind: 0, ink: '#1b1814', alpha: .15, sheen: 0 };
    return { kind: 0, ink: '#1b1814', alpha: .95, sheen: 1 };
  }
  function register(host) {
    if (host.__live) return;
    const cv = document.createElement('canvas'); cv.className = 'live-ink'; host.appendChild(cv); host.classList.add('live');
    const v = variant(host);
    host.__live = { host, cv, c: cv.getContext('2d'), seed: Math.random() * 10 + 1, surge: 0, surgeT: 0, ...v, w: 0, h: 0, rgb: hex(v.ink), drawn: false };
    B.list.push(host.__live);
  }
  // 隐藏屏幕上的墨团：把画布缩成 1×1，释放后备存储；重新可见时 renderBlot 会按尺寸重建
  function release() { for (const b of B.list) if (b.w > 1 && !b.host.offsetParent) { b.cv.width = b.cv.height = 1; b.w = b.h = 1; b.drawn = false; } }
  function scan() {
    if (!B.ok) return;
    document.querySelectorAll('.bb-ink:not(.live), .act-ink:not(.live)').forEach(register);
    B.list = B.list.filter(b => b.host.isConnected);
    for (const b of B.list) if (!b.w && !b.host.offsetParent) { b.cv.width = b.cv.height = 1; b.w = b.h = 1; }
    release();
    start();
  }
  function visible(b) {
    if (!b.host.offsetParent) return false;
    const r = b.cv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight || r.width < 2) return false;
    b.rect = r; return true;
  }
  function renderBlot(b, t) {
    const gl = B.gl, P = B.P, dpr = Math.min(devicePixelRatio || 1, 2) * .7;
    const w = Math.max(8, Math.round(b.rect.width * dpr)), h = Math.max(8, Math.round(b.rect.height * dpr));
    if (w !== b.w || h !== b.h) { b.cv.width = b.w = w; b.cv.height = b.h = h; }
    if (gl.canvas.width < w || gl.canvas.height < h) { gl.canvas.width = Math.max(gl.canvas.width, w); gl.canvas.height = Math.max(gl.canvas.height, h); }
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(P.p);
    gl.uniform2f(P.U.uRes, w, h); gl.uniform1f(P.U.uTime, t + b.seed * 13); gl.uniform1f(P.U.uSeed, b.seed);
    gl.uniform1f(P.U.uKind, b.kind); gl.uniform1f(P.U.uAlpha, b.alpha); gl.uniform1f(P.U.uSurge, b.surge); gl.uniform1f(P.U.uSheen, b.sheen);
    gl.uniform3f(P.U.uInk, ...b.rgb);
    draw(gl, P);
    // WebGL 画布原点在左下，读取区域在底部
    b.c.clearRect(0, 0, w, h);
    b.c.drawImage(gl.canvas, 0, gl.canvas.height - h, w, h, 0, 0, w, h);
    b.drawn = true;
  }
  function tick(now) {
    B.raf = 0;
    if (document.hidden) return;
    release();
    const vis = B.list.filter(visible);
    if (!vis.length) return;                      // 无可见墨团：停下，等下一次 scan
    B.raf = requestAnimationFrame(tick);
    const surging = vis.some(b => Math.abs(b.surge - b.surgeT) > .002);
    if (!surging && (++B.frame % 3)) return;      // 平时 20fps（墨很慢，足够顺滑），按压时 60fps
    const t = (now - B.t0) / 1000;
    for (const b of vis) {
      b.surge += (b.surgeT - b.surge) * (b.surgeT > b.surge ? .22 : .07);
      if (reduced() && b.drawn && !surging) continue;
      renderBlot(b, reduced() ? 0 : t);
    }
  }
  function start() { if (B.ok && !B.raf) B.raf = requestAnimationFrame(tick); }
  function press(btn, on) {
    const host = btn && btn.querySelector('.live'); if (!host || !host.__live) return;
    host.__live.surgeT = on ? 1 : 0; start();
  }

  /* ================= 全屏墨染 ================= */
  const S = { gl: null, P: null, cv: null, tex: null, ok: false };
  function initSpread() {
    try {
      S.cv = document.getElementById('inkfx'); if (!S.cv) return false;
      S.gl = mkGL(S.cv); if (!S.gl) return false;
      S.P = prog(S.gl, SPREAD_FRAG); S.ok = true;
    } catch (e) { console.warn('InkGL spread disabled:', e.message); S.ok = false; }
    return S.ok;
  }
  function setPaper(url) {
    if (!S.ok) return;
    const img = new Image(); img.onload = () => {
      const gl = S.gl; S.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, S.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      S.texSize = img.width;
    }; img.src = url;
  }
  // 播放一次墨染：k 从 k0→k1，返回 Promise；hold=true 时停在最后一帧
  function spread({ mode = 0, x, y, from = 0, to = 1, dur = 900, ease = 'inOut', scale = .5, z = 41 }) {
    return new Promise(res => {
      if (!S.ok) return res(false);
      const cv = S.cv, gl = S.gl, P = S.P;
      const W = innerWidth, H = innerHeight;
      cv.width = Math.round(W * scale); cv.height = Math.round(H * scale);
      cv.style.zIndex = z; cv.classList.add('on');
      gl.viewport(0, 0, cv.width, cv.height);
      const seed = Math.random() * 9 + 1, t0 = performance.now();
      const E = { inOut: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, out: k => 1 - Math.pow(1 - k, 3), in: k => k * k * k }[ease];
      const frame = now => {
        const k = Math.min(1, (now - t0) / dur), kk = from + (to - from) * E(k);
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(P.p);
        gl.uniform2f(P.U.uRes, cv.width, cv.height);
        gl.uniform2f(P.U.uC, (x ?? W / 2) * scale, (H - (y ?? H / 2)) * scale);
        gl.uniform1f(P.U.uTime, (now - t0) / 1000); gl.uniform1f(P.U.uK, kk); gl.uniform1f(P.U.uMode, mode); gl.uniform1f(P.U.uSeed, seed);
        gl.uniform3f(P.U.uInk, .106, .094, .078); gl.uniform3f(P.U.uPaper, .937, .902, .827);
        if (S.tex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, S.tex); gl.uniform1i(P.U.uTex, 0); }
        gl.uniform2f(P.U.uTexScale, W / (S.texSize ? S.texSize / 2 : 256), H / (S.texSize ? S.texSize / 2 : 256));
        draw(gl, P);
        if (k < 1) requestAnimationFrame(frame); else res(true);
      };
      requestAnimationFrame(frame);
    });
  }
  function hide() { if (S.cv) S.cv.classList.remove('on'); }


  /* ================= 吐纳·圆相 ================= */
  const Q = { gl: null, P: null, cv: null, ok: null };
  function qiInit(host) {
    if (Q.ok === false) return false;
    if (!Q.cv) {
      try {
        Q.cv = document.createElement('canvas'); Q.cv.className = 'qi-ink'; Q.cv.setAttribute('aria-hidden', 'true');
        Q.gl = mkGL(Q.cv); if (!Q.gl) throw new Error('no webgl'); Q.P = prog(Q.gl, QI_FRAG); Q.ok = true;
      } catch (e) { console.warn('InkGL qi disabled:', e.message); Q.ok = false; return false; }
    }
    if (Q.cv.parentNode !== host) host.insertBefore(Q.cv, host.firstChild);
    return true;
  }
  // host：卷轴纸面；onSink 在墨开始沉入纸中时调用（此时写下日志）
  function qi(host, { cy = .5, onSink, at } = {}) {
    return new Promise(res => {
      if (reduced() || !qiInit(host)) { onSink && onSink(); return res(false); }
      const cv = Q.cv, gl = Q.gl, P = Q.P;
      const W = host.clientWidth, H = host.clientHeight, k = Math.min(devicePixelRatio || 1, 2) * .4;
      cv.width = Math.max(8, Math.round(W * k)); cv.height = Math.max(8, Math.round(H * k));
      gl.viewport(0, 0, cv.width, cv.height);
      cv.classList.add('on');
      const seed = at != null ? 3.3 : Math.random() * 6 + 1, t0 = at != null ? performance.now() - at * 1000 : performance.now(), D = 1.8;
      const Rr = Math.min(.12, (W / H) * .2);            // 圆相半径（卷高为单位），窄屏自适应
      let sunk = false; const gen = Q.gen = (Q.gen || 0) + 1;
      const frame = now => {
        if (gen !== Q.gen) { if (!sunk) { sunk = true; onSink && onSink(); } return res(true); }   // 被新一次吐纳接替
        const t = (now - t0) / 1000;
        if (!sunk && t >= 1.1) { sunk = true; onSink && onSink(); }
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        if (t < D) {
          gl.useProgram(P.p);
          gl.uniform2f(P.U.uRes, cv.width, cv.height); gl.uniform2f(P.U.uC, cv.width / 2, cv.height * (1 - cy));
          gl.uniform1f(P.U.uT, t); gl.uniform1f(P.U.uSeed, seed); gl.uniform1f(P.U.uR, Rr);
          draw(gl, P); if (at == null) requestAnimationFrame(frame); else res(true);
        } else { cv.classList.remove('on'); res(true); }
      };
      requestAnimationFrame(frame);
    });
  }


  /* ================= 丹炉 ================= */
  const F = { gl: null, P: null, cv: null, tex: null, ok: null, raf: 0 };
  function furnaceInit() {
    if (F.ok === false) return false;
    if (F.ok) return true;
    try {
      F.cv = document.createElement('canvas'); F.cv.className = 'dan-gl'; F.cv.setAttribute('aria-hidden', 'true');
      F.gl = mkGL(F.cv); if (!F.gl) throw new Error('no webgl'); F.P = prog(F.gl, FURNACE_FRAG);
      const gl = F.gl; F.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, F.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, Ding.art());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      F.ok = true;
    } catch (e) { console.warn('InkGL furnace disabled:', e.message); F.ok = false; }
    return F.ok;
  }
  // 返回控制器：set(state) 切换状态；stop() 停止并释放画布
  const FSTATE = { fire: 0, ok: 1, gold: 2, boom: 3, waste: 4 };
  function furnace(host, opt = {}) {
    if (!furnaceInit()) return null;
    const cv = F.cv, gl = F.gl, P = F.P;
    host.appendChild(cv);
    const W = host.clientWidth, H = host.clientHeight, k = Math.min(devicePixelRatio || 1, 2) * (opt.scale || .75);
    cv.width = Math.max(8, Math.round(W * k)); cv.height = Math.max(8, Math.round(H * k));
    gl.viewport(0, 0, cv.width, cv.height);
    const seed = opt.seed ?? Math.random() * 6 + 1, t0 = performance.now();
    let st = 0, s0 = t0, gen = (F.gen = (F.gen || 0) + 1), frozen = null;
    const frame = now => {
      F.raf = 0; if (gen !== F.gen) return;
      const t = (frozen ? frozen.t : now - t0) / 1000, kk = (frozen ? frozen.k : now - s0) / 1000;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(P.p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, F.tex); gl.uniform1i(P.U.uDing, 0);
      gl.uniform2f(P.U.uRes, cv.width, cv.height); gl.uniform1f(P.U.uT, t); gl.uniform1f(P.U.uK, kk);
      gl.uniform1f(P.U.uState, st); gl.uniform1f(P.U.uSeed, seed); gl.uniform1f(P.U.uD, opt.size || .5);
      draw(gl, P);
      if (!reduced() && !frozen && !document.hidden) F.raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!F.raf) F.raf = requestAnimationFrame(frame); };
    // 静止画面：减弱动效时，或截图时由 at 指定
    if (reduced()) frozen = { t: 2000, k: 2000 };
    kick();
    const onVis = () => { if (!document.hidden) kick(); };
    document.addEventListener('visibilitychange', onVis);
    return {
      set(name) { st = FSTATE[name] ?? 0; s0 = performance.now(); frozen = reduced() ? { t: 2000, k: name === 'boom' ? 3000 : 2400 } : null; kick(); },
      at(tMs, kMs) { frozen = { t: tMs, k: kMs }; kick(); },
      stop() { gen = -1; F.gen++; cancelAnimationFrame(F.raf); F.raf = 0; document.removeEventListener('visibilitychange', onVis); cv.width = cv.height = 1; cv.remove(); },
    };
  }

  function init() {
    if (initBlots()) {
      scan();
      new MutationObserver(() => { clearTimeout(init.t); init.t = setTimeout(scan, 60); })
        .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-screen'] });
      document.addEventListener('visibilitychange', start);
      addEventListener('resize', start);
      const on = e => { const b = e.target.closest && e.target.closest('.brush-btn,.act'); if (b && !b.disabled) { press(b, true); B.pressed = b; } };
      const off = () => { if (B.pressed) { press(B.pressed, false); B.pressed = null; } };
      document.addEventListener('pointerdown', on, { passive: true });
      ['pointerup', 'pointercancel', 'blur'].forEach(ev => addEventListener(ev, off, { passive: true }));
    }
    initSpread();
  }
  return { init, scan, spread, hide, setPaper, qi, furnace, get ok() { return B.ok; }, get spreadOk() { return S.ok; }, kick: start };
})();
