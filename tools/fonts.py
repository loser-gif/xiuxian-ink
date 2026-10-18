#!/usr/bin/env python3
"""墨仙录 字体子集构建 + 覆盖审计。

用法：
  python3 tools/fonts.py audit   # 只审计：抽取 html/js/css 中所有字符，逐字体检查 cmap 与字形轮廓
  python3 tools/fonts.py build   # 重新生成子集与 css/fonts.css，然后审计
源字体放在 FONTSRC（默认 /workspace/fontsrc）：wenkai.ttf（霞鹜文楷）、msz.ttf（马善政）、zcool.ttf（志莽行书）。
"""
import os, re, sys, subprocess
from fontTools.ttLib import TTFont

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('FONTSRC', '/workspace/fontsrc')
FILES = ['index.html', 'js/data.js', 'js/gongfa.js', 'js/story.js', 'js/sect.js', 'js/core.js', 'js/world.js', 'js/jianghu.js', 'js/map.js', 'js/jhui.js', 'js/game.js', 'js/ink.js', 'js/fx.js', 'js/wallpaper.js', 'js/inkgl.js', 'css/style.css']
PUNCT = set('０１２３４５６７８９，。！？；：“”‘’（）《》、…—·「」　')
CAO_TEXT = '筑基金丹元婴化神飞升坐化成败渡劫入魔归隐兵解身殒攻守术奇胜负第一二三四五六七八九合晋'   # 草书大字只用于破境/终卷

def asset_v():
    # 与 index.html 的缓存版本号保持一致，免得 preload 与 @font-face 地址错开
    m = re.search(r'css/style\.css\?v=(\d+)', open(os.path.join(BASE, 'index.html'), encoding='utf8').read())
    return m.group(1) if m else '1'

def strip_comments(t, f):
    if f.endswith('.js') or f.endswith('.css'):
        t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    if f.endswith('.html'):
        t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    return t

def used_chars():
    txt = ''
    for f in FILES:
        p = os.path.join(BASE, f)
        if os.path.exists(p): txt += strip_comments(open(p, encoding='utf8').read(), f)
    s = set(c for c in txt if ord(c) > 0x2000 and not (0xFE00 <= ord(c) <= 0xFE0F))
    s |= PUNCT
    s |= set(chr(c) for c in range(0x20, 0x7f))
    s |= {'\u00b7'}
    return s

def gb2312():
    gb = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try: gb.add(bytes([hi, lo]).decode('gb2312'))
            except Exception: pass
    return gb

def ranges(s):
    cps = sorted(ord(c) for c in s); out = []; i = 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1: j += 1
        out.append(f'U+{cps[i]:X}' if i == j else f'U+{cps[i]:X}-{cps[j]:X}'); i = j + 1
    return ','.join(out)

def subset(src, out, chars, keep_vertical=False):
    tf = '/tmp/_sub.txt'; open(tf, 'w', encoding='utf8').write(''.join(sorted(chars)))
    drop = [] if keep_vertical else ['--drop-tables+=vhea,vmtx,VORG']
    subprocess.run(['pyftsubset', src, f'--text-file={tf}', '--flavor=woff2', f'--output-file={out}',
                    '--layout-features=kern,liga,calt,ccmp,locl,fwid,hwid,pwid,palt', '--no-hinting',
                    '--notdef-outline', '--name-IDs=*'] + drop, check=True)

def build():
    F = os.path.join(BASE, 'fonts') + '/'
    game = used_chars()
    extra = gb2312() - game
    subset(f'{SRC}/wenkai.ttf', F + 'wenkai-game.woff2', game)
    subset(f'{SRC}/wenkai.ttf', F + 'wenkai-extra.woff2', extra)
    subset(f'{SRC}/msz.ttf', F + 'mashanzheng.woff2', game)
    subset(f'{SRC}/zcool.ttf', F + 'cao.woff2', set(CAO_TEXT))
    # 只给每个子集声明它“确实有字形”的码位，避免浏览器按 unicode-range 去请求一个缺字的文件
    def have(path, want):
        cm = TTFont(path).getBestCmap(); return set(c for c in want if ord(c) in cm)
    g = have(F + 'wenkai-game.woff2', game); e = have(F + 'wenkai-extra.woff2', extra)
    m = have(F + 'mashanzheng.woff2', game); z = have(F + 'cao.woff2', set(CAO_TEXT))
    css = f"""/* 自托管字体子集：霞鹜文楷 (OFL) · 马善政楷书 (OFL) · 志莽行书 (OFL)  —— 由 tools/fonts.py 生成，勿手改 */
@font-face{{font-family:'MoWen';src:url(../fonts/wenkai-game.woff2?v=__V__) format('woff2');font-display:swap;unicode-range:{ranges(g)}}}
@font-face{{font-family:'MoWen';src:url(../fonts/wenkai-extra.woff2?v=__V__) format('woff2');font-display:swap;unicode-range:{ranges(e)}}}
@font-face{{font-family:'MoShu';src:url(../fonts/mashanzheng.woff2?v=__V__) format('woff2');font-display:swap;unicode-range:{ranges(m)}}}
@font-face{{font-family:'MoCao';src:url(../fonts/cao.woff2?v=__V__) format('woff2');font-display:block;unicode-range:{ranges(z)}}}
"""
    open(os.path.join(BASE, 'css/fonts.css'), 'w').write(css.replace('__V__', os.environ.get('ASSET_V') or asset_v()))
    print(f'built: game={len(game)} extra={len(extra)}')

def glyph_ok(font, ch):
    cm = font.getBestCmap(); gn = cm.get(ord(ch))
    if gn is None: return 'missing'
    if ch.isspace() or ch == '\u3000': return 'ok'
    if 'glyf' in font:
        g = font['glyf'][gn]
        if g.numberOfContours == 0: return 'empty'
    return 'ok'

def audit():
    F = os.path.join(BASE, 'fonts') + '/'
    used = used_chars()
    cjk = sorted(c for c in used if ord(c) >= 0x3400)
    wk = [TTFont(F + 'wenkai-game.woff2'), TTFont(F + 'wenkai-extra.woff2')]
    msz = TTFont(F + 'mashanzheng.woff2'); cao = TTFont(F + 'cao.woff2')
    bad = 0
    print(f'字符总数 {len(used)}，其中汉字/全角 {len(cjk)}')
    # 1) MoWen（正文）必须覆盖每一个用到的字
    miss = [c for c in sorted(used) if c.strip() and all(glyph_ok(f, c) != 'ok' for f in wk)]
    print(f'MoWen  (文楷 game+extra): 缺 {len(miss)}', ''.join(miss)); bad += len(miss)
    # 同一字不能同时出现在两个文楷子集（防止 iOS 混用两份文件）
    dup = [c for c in used if ord(c) in wk[0].getBestCmap() and ord(c) in wk[1].getBestCmap() and ord(c) > 0x7f]
    print(f'MoWen  子集重叠: {len(dup)}', ''.join(dup[:40])); bad += len(dup)
    # 2) MoShu（标题）缺字会退回 MoWen，可接受但列出
    m2 = [c for c in cjk if glyph_ok(msz, c) != 'ok']
    print(f'MoShu  (马善政): 缺 {len(m2)}（退回文楷显示）', ''.join(m2))
    # 3) MoCao（草书大字）
    m3 = [c for c in CAO_TEXT if glyph_ok(cao, c) != 'ok']
    print(f'MoCao  (行草): 缺 {len(m3)}', ''.join(m3)); bad += len(m3)
    # 4) 竖排度量：已不再依赖 writing-mode，确认子集里没有残留 vhea/vmtx
    for name, f in [('wenkai-game', wk[0]), ('wenkai-extra', wk[1]), ('mashanzheng', msz), ('cao', cao)]:
        if 'vhea' in f or 'vmtx' in f: print(f'  注意: {name} 仍含 vhea/vmtx')
    # 5) css 里声明的 unicode-range 必须与文件 cmap 一致
    css = open(os.path.join(BASE, 'css/fonts.css')).read()
    for fam, fn in [('MoWen', 'wenkai-game'), ('MoWen', 'wenkai-extra'), ('MoShu', 'mashanzheng'), ('MoCao', 'cao')]:
        m = re.search(rf"{fn}\.woff2[^}}]*unicode-range:([^}}]+)}}", css)
        if not m: print('  css 缺少', fn); bad += 1; continue
        cps = set()
        for part in m.group(1).split(','):
            a, _, b = part.strip()[2:].partition('-'); a = int(a, 16); b = int(b, 16) if b else a
            cps |= set(range(a, b + 1))
        cm = TTFont(F + fn + '.woff2').getBestCmap()
        lie = [chr(c) for c in cps if c not in cm]
        if lie: print(f'  {fn}: unicode-range 声明了文件里没有的 {len(lie)} 字', ''.join(lie[:30])); bad += len(lie)
    print('审计结果:', '通过' if bad == 0 else f'失败 {bad}')
    return bad

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'audit'
    if cmd == 'build': build()
    sys.exit(1 if audit() else 0)
