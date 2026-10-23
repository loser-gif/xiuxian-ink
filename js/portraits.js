/* 纸上仙途 · 人物小像。一式水墨半身，题在事卷右侧，如画心旁的题画。 */
'use strict';
const InkPortrait = (() => {
  const INK = '#1b1814';
  const PAPER = '#f6f0e2';
  const ZHU = '#9a332c';

  const P = {
    ahe: { hair: 'child', eyes: 'wide', mouth: 'smile', prop: 'none', brow: 0 },
    shengu: { hair: 'wound', eyes: 'down', mouth: 'flat', prop: 'bag', brow: 1 },
    qingzhen: { hair: 'elderF', eyes: 'kind', mouth: 'smile', prop: 'bowl', brow: 0 },
    zhouwan: { hair: 'woman', eyes: 'soft', mouth: 'smile', prop: 'cup', brow: 0 },
    fox: { hair: 'fox', eyes: 'wide', mouth: 'smile', prop: 'tail', brow: 0 },
    linzhao: { hair: 'disciple', eyes: 'side', mouth: 'flat', prop: 'none', brow: 1 },
    beggar: { hair: 'elder', eyes: 'kind', mouth: 'smile', prop: 'bowl', brow: 0 },
    qiuniang: { hair: 'woman', eyes: 'soft', mouth: 'flat', prop: 'lamp', brow: 0 },
    zhaoheng: { hair: 'scholar', eyes: 'down', mouth: 'flat', prop: 'book', brow: 0 },
    aman: { hair: 'huntress', eyes: 'sharp', mouth: 'flat', prop: 'bow', brow: 1 },
    shifu: { hair: 'master', eyes: 'down', mouth: 'flat', prop: 'cup', brow: 1 },
    dx_shi: { hair: 'master', eyes: 'sharp', mouth: 'flat', prop: 'gourd', brow: 2 },
    yy_shi: { hair: 'hood', eyes: 'down', mouth: 'flat', prop: 'lamp', brow: 1 },
    xj_shi: { hair: 'scholar', eyes: 'sharp', mouth: 'flat', prop: 'disk', brow: 1 },
    su: { hair: 'woman', eyes: 'soft', mouth: 'smile', prop: 'gourd', brow: 0 },
    xie: { hair: 'long', eyes: 'soft', mouth: 'smile', prop: 'rain', brow: 0 },
    lu: { hair: 'sword', eyes: 'sharp', mouth: 'flat', prop: 'sword', brow: 2 },
    bai: { hair: 'long', eyes: 'down', mouth: 'flat', prop: 'rain', brow: 0 },
    wen: { hair: 'scholar', eyes: 'side', mouth: 'smile', prop: 'book', brow: 1 },
    shi: { hair: 'disciple', eyes: 'wide', mouth: 'smile', prop: 'bowl', brow: 0 },
    pei: { hair: 'sword', eyes: 'wide', mouth: 'flat', prop: 'sword', brow: 1 },
    tang: { hair: 'woman', eyes: 'sharp', mouth: 'smile', prop: 'gourd', brow: 1 },
    shen: { hair: 'hood', eyes: 'down', mouth: 'flat', prop: 'lamp', brow: 0 },
    qian: { hair: 'scholar', eyes: 'side', mouth: 'flat', prop: 'disk', brow: 0 },
    mi: { hair: 'elderF', eyes: 'kind', mouth: 'flat', prop: 'gourd', brow: 0 },
    helan: { hair: 'master', eyes: 'sharp', mouth: 'flat', prop: 'sword', brow: 2 },
    liu: { hair: 'long', eyes: 'down', mouth: 'flat', prop: 'book', brow: 1 },
    gu: { hair: 'wild', eyes: 'sharp', mouth: 'flat', prop: 'sword', brow: 2 },
    yu: { hair: 'wound', eyes: 'kind', mouth: 'flat', prop: 'rain', brow: 1 },
    baiwei: { hair: 'long', eyes: 'side', mouth: 'flat', prop: 'none', brow: 0 },
    tu: { hair: 'disciple', eyes: 'wide', mouth: 'smile', prop: 'none', brow: 0 },
    tu2: { hair: 'sword', eyes: 'sharp', mouth: 'flat', prop: 'sword', brow: 1 },
    tu3: { hair: 'wild', eyes: 'side', mouth: 'flat', prop: 'sword', brow: 2 },
  };

  function hairPath(k) {
    if (k === 'child') return `<path d="M29 52c1-18 8-28 15-28s14 10 15 28c-3-10-10-14-15-14s-12 4-15 14z" fill="${INK}"/><circle cx="32" cy="34" r="4.2" fill="${INK}"/><circle cx="56" cy="35" r="4" fill="${INK}"/>`;
    if (k === 'woman') return `<path d="M27 54c-1-22 8-34 17-34s18 12 18 34c-7-16-28-16-35 0z" fill="${INK}"/><circle cx="44" cy="22" r="6" fill="${INK}"/><path d="M26 56c1 16 3 26 5 34M62 56c-1 16-3 26-5 34" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (k === 'long') return `<path d="M26 50c0-20 8-30 18-30s18 10 18 30c-8-12-28-12-36 0z" fill="${INK}"/><path d="M24 52c2 22 2 34 1 44M64 52c-2 22-2 34-1 44M30 58c1 20 0 30-1 40M58 58c-1 20 0 30 1 40" fill="none" stroke="${INK}" stroke-width="1.7" stroke-linecap="round" opacity=".85"/>`;
    if (k === 'elder') return `<path d="M30 46c2-12 8-18 14-18 4 0 8 2 11 6" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M36 70c2 8 6 12 8 12s6-4 8-12" fill="${INK}" opacity=".8"/><path d="M32 44c6-8 20-6 24 2" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".7"/>`;
    if (k === 'elderF') return `<path d="M28 50c2-16 10-24 16-22 8 2 14 12 14 24-8-10-24-10-30-2z" fill="${INK}" opacity=".9"/><path d="M30 62c2 14 4 22 6 26M58 62c-2 14-4 22-6 26" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (k === 'fox') return `<path d="M30 40 L24 22 L38 34Z M58 40 L64 22 L50 34Z" fill="${INK}"/><path d="M28 52c2-16 10-24 16-24s14 8 16 24c-6-10-26-10-32 0z" fill="${INK}"/>`;
    if (k === 'scholar') return `<path d="M24 40h40l-4 8H28z" fill="${INK}"/><path d="M30 48c2-6 8-8 14-8s12 2 14 8v6H30z" fill="${INK}"/>`;
    if (k === 'huntress') return `<path d="M26 46c4-16 12-22 18-22s14 6 18 22c-8-8-28-8-36 0z" fill="${INK}"/><path d="M24 44h40" stroke="${INK}" stroke-width="2.2"/><path d="M27 58c2 16 2 24 1 30M61 58c-2 16-2 24-1 30" fill="none" stroke="${INK}" stroke-width="2"/>`;
    if (k === 'disciple') return `<path d="M30 50c2-16 8-24 14-24s12 8 14 24c-4-10-24-10-28 0z" fill="${INK}"/><path d="M42 26c2-8 6-10 4-14" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (k === 'master') return `<path d="M30 46c2-14 8-20 14-20s12 6 14 20c-6-8-22-8-28 0z" fill="${INK}"/><path d="M41 24c1-12 8-14 6-18" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M34 72c3 10 7 14 10 14s7-4 10-14" fill="${INK}" opacity=".85"/>`;
    if (k === 'hood') return `<path d="M22 58c2-28 12-40 22-40s20 12 22 40c-8-6-36-6-44 0z" fill="${INK}" opacity=".92"/>`;
    if (k === 'sword') return `<path d="M28 48c3-16 10-24 16-24s13 8 16 24c-6-10-26-10-32 0z" fill="${INK}"/><path d="M40 22 l4-14 4 14" fill="${INK}"/>`;
    if (k === 'wild') return `<path d="M22 56c4-24 10-36 16-30 4 4 2 10 8 8 8-2 16 6 18 22-10-16-30-14-42 0z" fill="${INK}"/>`;
    if (k === 'wound') return `<path d="M28 50c2-14 10-22 16-22s14 8 16 22c-6-8-26-8-32 0z" fill="${INK}" opacity=".75"/><path d="M36 42 l8 6" stroke="${ZHU}" stroke-width="1.3" opacity=".8"/>`;
    return '';
  }

  function eyes(k) {
    const y = k === 'down' ? 50 : 48;
    const shy = k === 'side' ? 'M34 48h6M50 49h5' : `M33 ${y}q4-3 8 0M47 ${y}q4-3 8 0`;
    const dot = k === 'wide' ? `<circle cx="37" cy="${y}" r="1" fill="${INK}"/><circle cx="51" cy="${y}" r="1" fill="${INK}"/>` : '';
    return `<path d="${shy}" fill="none" stroke="${INK}" stroke-width="1.25" stroke-linecap="round"/>${dot}`;
  }
  function brows(n) {
    if (!n) return `<path d="M32 43q4-2 8 0M48 43q4-2 8 0" fill="none" stroke="${INK}" stroke-width="1" opacity=".7"/>`;
    if (n === 2) return `<path d="M32 44q4-4 9 1M47 45q5-5 9 0" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
    return `<path d="M32 44q4-1 8 1M48 44q4-1 8 1" fill="none" stroke="${INK}" stroke-width="1.05" opacity=".8"/>`;
  }
  function mouth(k) {
    if (k === 'smile') return `<path d="M40 58q4 4 8 0" fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>`;
    return `<path d="M40 59h8" stroke="${INK}" stroke-width="1" stroke-linecap="round" opacity=".75"/>`;
  }
  function prop(k) {
    if (k === 'bow') return `<path d="M70 28q10 22 0 46" fill="none" stroke="${INK}" stroke-width="1.3"/><path d="M70 30v42" stroke="${INK}" stroke-width=".6" opacity=".7"/>`;
    if (k === 'book') return `<path d="M64 78h16v14h-16z" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M72 78v14" stroke="${INK}" stroke-width=".7"/>`;
    if (k === 'cup') return `<path d="M66 82h10l-1 8h-8z" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M76 86h4" stroke="${INK}" stroke-width="1"/>`;
    if (k === 'gourd') return `<circle cx="72" cy="78" r="4" fill="none" stroke="${INK}" stroke-width="1.2"/><circle cx="72" cy="88" r="5.5" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
    if (k === 'lamp') return `<path d="M70 70h12l-2 10h-8z" fill="${INK}" opacity=".75"/><path d="M76 80v12" stroke="${INK}" stroke-width="1.1"/>`;
    if (k === 'sword') return `<path d="M74 24v48" stroke="${INK}" stroke-width="1.3"/><path d="M69 40h10" stroke="${INK}" stroke-width="1.2"/>`;
    if (k === 'bowl') return `<path d="M64 88q8 8 16 0" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
    if (k === 'bag') return `<path d="M66 74h12l2 16h-16z" fill="none" stroke="${INK}" stroke-width="1.1"/>`;
    if (k === 'tail') return `<path d="M68 70c10 4 12 18 4 26" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (k === 'disk') return `<circle cx="74" cy="84" r="7" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M74 77v14M67 84h14" stroke="${INK}" stroke-width=".6"/>`;
    if (k === 'rain') return `<path d="M66 30c2 8-1 10 1 16M72 26c2 10-1 12 1 18M78 32c1 8-1 9 1 14" fill="none" stroke="${INK}" stroke-width=".8" opacity=".55"/>`;
    return '';
  }

  function svg(id, face) {
    const s = P[id]; if (!s) return '';
    const mouthK = face && face.mouth ? face.mouth : s.mouth;
    const browN = face && face.brow != null ? face.brow : s.brow;
    return `<svg class="ink-portrait" viewBox="0 0 88 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="44" cy="58" rx="36" ry="48" fill="${INK}" opacity=".045"/>
      <path d="M16 112c2-30 10-44 28-46 18 2 26 16 28 46" fill="${INK}" opacity=".9"/>
      <path d="M34 74c4 10 16 10 20 0" fill="none" stroke="${PAPER}" stroke-width="1.3" opacity=".55"/>
      <path d="M40 66c1 10 7 12 8 0" fill="${PAPER}"/>
      <ellipse cx="44" cy="50" rx="15" ry="17" fill="${PAPER}" stroke="${INK}" stroke-width="1.35"/>
      ${hairPath(s.hair)}
      ${brows(browN)}
      ${eyes(s.eyes)}
      <path d="M44 50v6" stroke="${INK}" stroke-width=".7" opacity=".35"/>
      ${mouth(mouthK)}
      ${prop(s.prop)}
    </svg>`;
  }

  const BY = {
    shoutu: 'tu', disciple: 'tu', yg_tu_return: 'tu',
    yg_su_vow: 'su', yg_su_aid: 'su', yg_su_seed: 'su',
    yg_lu_foe: 'lu', yg_lu_seed: 'lu', lu_duel: 'lu', lu_sword: 'lu', meet_lu: 'lu', lu_save: 'lu',
    bond_meet: 'xie', bond_dual: 'xie', bond_jie: 'xie',
    bond_fate: 'tu', bond_inherit: 'tu2', bond_surpass: 'tu2', bond_betray: 'tu3',
    sf_tea: 'shifu', sf_test: 'shifu', sf_old: 'shifu',
  };

  function forEvent(ev, face) {
    if (!ev) return '';
    let id = ev.portrait || BY[ev.id] || '';
    const eid = ev.id || '';
    if (!id && (eid.startsWith('echo_') || eid.startsWith('deed_'))) id = eid.slice(eid.indexOf('_') + 1);
    if (!id && (eid.startsWith('su_') || eid.startsWith('yg_su'))) id = 'su';
    if (!id && eid.startsWith('sf_')) id = 'shifu';
    if (!id && eid.startsWith('dx_')) id = 'dx_shi';
    if (!id && eid.startsWith('yy_')) id = 'yy_shi';
    if (!id && eid.startsWith('xj_')) id = 'xj_shi';
    return P[id] ? svg(id, face) : '';
  }

  return { svg, forEvent, ids: () => Object.keys(P) };
})();
