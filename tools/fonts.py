#!/usr/bin/env python3
"""墨仙录 字体子集构建 + 覆盖审计。

用法：
  python3 tools/fonts.py audit   # 只审计：抽取 html/js/css 中所有字符，逐字体检查 cmap 与字形轮廓
  python3 tools/fonts.py build   # 重新生成子集与 css/fonts.css，然后审计
源字体放在 FONTSRC（默认 /workspace/fontsrc）：
  wenkai.ttf  霞鹜文楷 Regular（OFL，https://github.com/lxgw/LxgwWenKai）
  msz.ttf     马善政楷书（OFL，Google Fonts）
  zcool.ttf   志莽行书（OFL，Google Fonts）
"""
import os, re, sys, subprocess, tempfile
from fontTools.ttLib import TTFont

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('FONTSRC', '/workspace/fontsrc')
PUNCT = set('０１２３４５６７８９，。！？；：“”‘’（）《》、…—·「」　↑↓□')
# 行草大字：破境境名、终卷、斗法第N合、晋升「晋」、定型仪式、拜山帖、法宝开光。
# 姓名池与随机宗门名在 js 源文里，随 used_chars() 进入正文/标题子集，不必写在这里。
CAO_TEXT = (
    '筑基金丹元婴化神飞升'          # NEXT_REALM_NAME，#bt-big
    '坐化入魔归隐兵解身殒人皇权臣'  # 终卷 #end-title
    '攻守术奇胜负'                  # 斗法出招 / 对撞
    '第合十零一二三四五六七八九'    # 第N合（cn）
    '晋'                            # 晋升仪式
    '道基丹纹法相问道劫纹'          # 定型仪式标题
    '拜山帖'                        # 拜山帖
    '认主开光祭炼化形'              # 法宝仪式
    '红尘仙出身山神镇魔传说'              # 出身帖、稀有终卷
)

def source_files():
    files = []
    js = os.path.join(BASE, 'js')
    for name in sorted(os.listdir(js)):
        if name.endswith('.js'):
            files.append('js/' + name)
    files += ['index.html', 'css/style.css']
    return files

def asset_v():
    # 与 index.html 的缓存版本号保持一致，免得 preload 与 @font-face 地址错开
    m = re.search(r'css/style\.css\?v=(\d+)', open(os.path.join(BASE, 'index.html'), encoding='utf8').read())
    return m.group(1) if m else '1'

def strip_comments(t, f):
    if f.endswith('.js') or f.endswith('.css'):
        t = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
        t = re.sub(r'(^|[^:])//.*?$', r'\1', t, flags=re.M)
    if f.endswith('.html'):
        t = re.sub(r'<!--.*?-->', '', t, flags=re.S)
    return t

def used_chars():
    txt = ''
    for f in source_files():
        p = os.path.join(BASE, f)
        if os.path.exists(p):
            txt += strip_comments(open(p, encoding='utf8').read(), f)
    s = set(c for c in txt if ord(c) > 0x2000 and not (0xFE00 <= ord(c) <= 0xFE0F))
    s |= PUNCT
    s |= set(chr(c) for c in range(0x20, 0x7f))
    s |= {'\u00b7', '↑', '↓', '□'}
    s |= set(CAO_TEXT)
    return s

def gb2312():
    gb = set()
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                gb.add(bytes([hi, lo]).decode('gb2312'))
            except Exception:
                pass
    return gb

def ranges(s):
    cps = sorted(ord(c) for c in s)
    out = []
    i = 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        out.append(f'U+{cps[i]:X}' if i == j else f'U+{cps[i]:X}-{cps[j]:X}')
        i = j + 1
    return ','.join(out)

def subset(src, out, chars, keep_vertical=False):
    drop = [] if keep_vertical else ['--drop-tables+=vhea,vmtx,VORG']
    with tempfile.TemporaryDirectory(prefix='font-', dir=BASE) as temp:
        tf = os.path.join(temp, 'chars.txt')
        with open(tf, 'w', encoding='utf8') as f:
            f.write(''.join(sorted(chars)))
        subprocess.run([sys.executable, '-m', 'fontTools.subset', src, f'--text-file={tf}', '--flavor=woff2', f'--output-file={out}',
                        '--layout-features=kern,liga,calt,ccmp,locl,fwid,hwid,pwid,palt', '--no-hinting',
                        '--notdef-outline', '--name-IDs=*'] + drop, check=True)

def transplant(dst_path, src_path, cps):
    """把源字体里才有的字符按 em 缩放拷进目标子集。
    马善政官方字库缺少部分符号与「箓」，仅补缺字，已有字形保持不变。"""
    from fontTools.pens.ttGlyphPen import TTGlyphPen
    from fontTools.pens.transformPen import TransformPen
    dst = TTFont(dst_path)
    src = TTFont(src_path)
    scmap = src.getBestCmap() or {}
    dcmap = dst.getBestCmap() or {}
    scale = dst['head'].unitsPerEm / src['head'].unitsPerEm
    glyf = dst['glyf']
    hmtx = dst['hmtx']
    added = []
    for cp in cps:
        if cp in dcmap:
            continue
        gn = scmap.get(cp)
        if gn is None:
            continue
        new = f'copy{cp:04X}'
        pen = TTGlyphPen(None)
        src['glyf'][gn].draw(TransformPen(pen, (scale, 0, 0, scale, 0, 0)), src['glyf'])
        glyf[new] = pen.glyph()
        adv, lsb = src['hmtx'][gn]
        hmtx[new] = (int(round(adv * scale)), int(round(lsb * scale)))
        for table in dst['cmap'].tables:
            if table.isUnicode():
                table.cmap[cp] = new
        added.append(cp)
    if not added:
        return []
    order = dst.getGlyphOrder()
    for cp in added:
        name = f'copy{cp:04X}'
        if name not in order:
            order.append(name)
    dst.setGlyphOrder(order)
    if 'maxp' in dst:
        dst['maxp'].numGlyphs = len(order)
    dst.save(dst_path)
    return added

def build():
    F = os.path.join(BASE, 'fonts') + '/'
    game = used_chars()
    extra = gb2312() - game
    subset(f'{SRC}/wenkai.ttf', F + 'wenkai-game.woff2', game)
    subset(f'{SRC}/wenkai.ttf', F + 'wenkai-extra.woff2', extra)
    subset(f'{SRC}/msz.ttf', F + 'mashanzheng.woff2', game)
    subset(f'{SRC}/zcool.ttf', F + 'cao.woff2', set(CAO_TEXT))
    # 马善政全集缺少这些字符；沿用文楷补字，不修改已有标题字形。
    fallback = [ord(c) for c in '·↑↓□›・箓' if c in game]
    copied = transplant(F + 'mashanzheng.woff2', f'{SRC}/wenkai.ttf', fallback)

    def have(path, want):
        cm = TTFont(path).getBestCmap()
        return set(c for c in want if ord(c) in cm)

    g = have(F + 'wenkai-game.woff2', game)
    e = have(F + 'wenkai-extra.woff2', extra)
    m = have(F + 'mashanzheng.woff2', game)
    z = have(F + 'cao.woff2', set(CAO_TEXT))
    css = f"""/* 自托管字体子集：霞鹜文楷 v1.530 (OFL) · 马善政楷书 (OFL) · 志莽行书 (OFL)  —— 由 tools/fonts.py 生成，勿手改 */
@font-face{{font-family:'MoWen';src:url(../fonts/wenkai-game.woff2?v=__V__) format('woff2');font-display:swap;unicode-range:{ranges(g)}}}
@font-face{{font-family:'MoWen';src:url(../fonts/wenkai-extra.woff2?v=__V__) format('woff2');font-display:swap;unicode-range:{ranges(e)}}}
@font-face{{font-family:'MoShu';src:url(../fonts/mashanzheng.woff2?v=__V__) format('woff2');font-display:swap;unicode-range:{ranges(m)}}}
@font-face{{font-family:'MoCao';src:url(../fonts/cao.woff2?v=__V__) format('woff2');font-display:block;unicode-range:{ranges(z)}}}
"""
    open(os.path.join(BASE, 'css/fonts.css'), 'w').write(css.replace('__V__', os.environ.get('ASSET_V') or asset_v()))
    print(f'built: game={len(game)} extra={len(extra)} cao={len(set(CAO_TEXT))} transplanted={len(copied)}')

def glyph_ok(font, ch):
    cm = font.getBestCmap()
    gn = cm.get(ord(ch))
    if gn is None:
        return 'missing'
    if ch.isspace() or ch == '\u3000':
        return 'ok'
    if 'glyf' in font:
        g = font['glyf'][gn]
        if g.numberOfContours == 0 and not g.isComposite():
            return 'empty'
    return 'ok'

def audit():
    F = os.path.join(BASE, 'fonts') + '/'
    used = used_chars()
    cjk = sorted(c for c in used if 0x3400 <= ord(c) <= 0x9FFF)
    wk = [TTFont(F + 'wenkai-game.woff2'), TTFont(F + 'wenkai-extra.woff2')]
    msz = TTFont(F + 'mashanzheng.woff2')
    cao = TTFont(F + 'cao.woff2')
    bad = 0
    print(f'扫描 {len(source_files())} 个文件；字符总数 {len(used)}，其中汉字 {len(cjk)}')
    miss = [c for c in sorted(used) if c.strip() and all(glyph_ok(f, c) != 'ok' for f in wk)]
    print(f'MoWen  (文楷 game+extra): 缺 {len(miss)}', ''.join(miss))
    bad += len(miss)
    dup = [c for c in used if ord(c) in wk[0].getBestCmap() and ord(c) in wk[1].getBestCmap() and ord(c) > 0x7f]
    print(f'MoWen  子集重叠: {len(dup)}', ''.join(dup[:40]))
    bad += len(dup)
    m2 = [c for c in cjk if glyph_ok(msz, c) != 'ok']
    sym = [c for c in sorted(used) if c.strip() and ord(c) < 0x3400 and glyph_ok(msz, c) != 'ok']
    print(f'MoShu  (马善政): 汉字缺 {len(m2)}', ''.join(m2))
    print(f'MoShu  符号缺 {len(sym)}', ''.join(sym))
    bad += len(m2)
    m3 = [c for c in dict.fromkeys(CAO_TEXT) if glyph_ok(cao, c) != 'ok']
    print(f'MoCao  (行草): 缺 {len(m3)}', ''.join(m3))
    bad += len(m3)
    for name, f in [('wenkai-game', wk[0]), ('wenkai-extra', wk[1]), ('mashanzheng', msz), ('cao', cao)]:
        if 'vhea' in f or 'vmtx' in f:
            print(f'  注意: {name} 仍含 vhea/vmtx')
    css = open(os.path.join(BASE, 'css/fonts.css')).read()
    for fam, fn in [('MoWen', 'wenkai-game'), ('MoWen', 'wenkai-extra'), ('MoShu', 'mashanzheng'), ('MoCao', 'cao')]:
        m = re.search(rf"{fn}\.woff2[^}}]*unicode-range:([^}}]+)}}", css)
        if not m:
            print('  css 缺少', fn)
            bad += 1
            continue
        cps = set()
        for part in m.group(1).split(','):
            a, _, b = part.strip()[2:].partition('-')
            a = int(a, 16)
            b = int(b, 16) if b else a
            cps |= set(range(a, b + 1))
        cm = TTFont(F + fn + '.woff2').getBestCmap()
        lie = [chr(c) for c in cps if c not in cm]
        if lie:
            print(f'  {fn}: unicode-range 声明了文件里没有的 {len(lie)} 字', ''.join(lie[:30]))
            bad += len(lie)
    print('审计结果:', '通过' if bad == 0 else f'失败 {bad}')
    return bad

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'audit'
    if cmd == 'build':
        build()
    sys.exit(1 if audit() else 0)
