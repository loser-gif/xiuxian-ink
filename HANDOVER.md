# 纸上仙途 · 交接

这份文档给下一位人，也给没有上下文的编程工具。短规矩在 `AGENTS.md`（`CLAUDE.md`、`.cursorrules` 是同一份）。改玩法之前先读完硬规矩，再按需要翻下面的章节。

对外名字是「纸上仙途」。文件头注释里的「墨仙录」指的是同一份代码，不要另起一套存档或另一套页面。

本分支缓存号是 `?v=106`，存档结构版本 `SAVE_V` 是 16。v106 把试炼问询、存档图鉴行囊、出身拜山道基和此生所求收到同纸揭笺：淡罩、淡边，去掉问询木轴和深色仪式底。闲录改成透出远山的一层，夜墨里墨童仍是深色墨滴。正传存档键与 `SAVE_V` 未动，闲录仍只写 `moxian-idle-v1`。验收见 `docs/reviews/quiet-unify-v106/`。v105 在卷首 2×2 之下加了「闲录 / 墨童」，打开同纸挂机层：点墨、置办、心法、机缘、再落一墨。进度只写 `moxian-idle-v1`，不读不写正传三卷，不升 `SAVE_V`。验收见 `docs/reviews/idle-v105/`。v104 把奇遇收成同纸揭笺：底纸几乎不压暗，笺面与主卷同一张宣纸，对手写在纸上，右侧留朱签。玩法与 SAVE_V 未动。验收见 `docs/reviews/tip-in-event-v104/`。v103 把奇遇、地图和桌面纸笺的厚木轴收成淡墨细边，主卷不再依赖木框贴图；掌上的设与静留在画面里，中宽卷首避开松和深山。玩法与 SAVE_V 未动。验收见 `docs/reviews/quiet-edge-v103/`。v102 只隐藏拜山页的滚动轨道，保留内容滚动及布局。v101 修复吐纳墨气的矩形裁边，增加主界面常驻回到卷首按钮，将测灵根入口移到中央灵石；首次测试与两次重测规则不变，键盘和触屏均可操作。验收见 `docs/reviews/interaction-fixes-v101/`。v100 将 v99 飞字改为原位显墨：开卷 2.6 秒、续卷 1.9 秒、新局入卷 2.1 秒。离场景用 160×100 的柔边不规则透明遮罩隐入现有底纸，不增加美术资源；续卷短暂显出存档年月。移除主卷旧 paperSettle 微翻转，保持正文稳定。继续沿用减少动态、跳过及输入保护，片头未改。验收见 `docs/reviews/paper-ink-v100/`。v99 保留 v98 片头，新增开卷 2.7 秒、续卷 1.7 秒、题名入卷 1.9 秒的同纸转场。离场山水用短暂副本保留原位置；人物字样落位后再出属性，转场结束再弹此生所求。简动效或中断直接到达，临时层与键盘保护会清理。验收见 `docs/reviews/paper-passage-v99/`。v98 按用户反馈回到 v95 原题额写画、墨落成舟、山河展开，完整演出约 14 秒，随时可跳过，不再按回访偏好压缩片头；保留 v97 松手保护。竖屏使用原素材重排四字，重新布局菜单与主卷；侧笺墨条仅滚动/键盘聚焦时出现，活墨及静态笔触补齐收锋。验收见 `docs/reviews/graceful-voyage-v98/`。v97 补齐长按跳过的输入保护：松手前吸收重复按键，松手后吸收尾随点击，避免跳过时误开卷；视觉沿用 v96。v96 经用户确认重做开场为“空纸生山河”，直接显露现有菜单；首次 5.6 秒、回访 0.9 秒，简动效 0.24 秒，可点击/按键跳过。开卷与续卷沿同纸淡入内页，角色存档不变；新增展示偏好 `moxian.openingSeen`。验收见 `docs/reviews/paper-awakening-v96/`。v95 按用户新基准回到卷首活墨：主界面共用菜单底纸，去掉木轴、全景插画、段落背山与枫枝，保留底边微景、细墨纸边和淡朱页签；开场与 SAVE_V 未动。验收见 `docs/reviews/quiet-ink-v95/`。v94 在主卷复用卷首雾纹、波光和舟鹤，低分辨率流雾以 20fps 绘制，离开主卷、页面隐藏、简动效或系统减少动态时停止。验收见 `docs/reviews/living-scroll-v94/`。v93 按用户确认的桌面、手机画卷设计重做主界面，手机人物信息可展开、四个页签切换实际摘要与入口；美术为独立 WebP，正文与控件仍为 DOM。验收见 `docs/reviews/scroll-v93/`。v92 修复斗法墨层撑出滚动区与窄屏抽屉样式误作用于整页的问题，笔触与玩法保留。v91 已撤回，不复用其缓存号。验收见 `docs/reviews/desktop-v92/`。v90 去掉主卷顶部的境界山河图，人物笺和日志笺也不再装木边和白头，改成淡墨纸边。玩法与 SAVE_V 未动。v89 让开场题额像毛笔写画，淡山、云、副题和问道印一起落上，写完不再空等，接着落墨成舟。玩法与 SAVE_V 未动。v88 把开场题额换回选定的那一幅，四字、问道印和副题都在；墨点落地后洇成小舟，水纹再展开山河。玩法与 SAVE_V 未动。v87 让纸上先写下「纸上仙途」，最后一滴墨落成小舟，水纹过处现出远山、松和倒影，舟停之后才见开卷，朱印最后落定。玩法与 SAVE_V 未动。v86 让题额落定后整张纸展开成卷首，山河、题印和开卷在同一张纸上慢慢出来。玩法与 SAVE_V 未动。v85 让题额末笔折成一道墨，四字顺着收进竖题。玩法与 SAVE_V 未动。v84 让题额四字飞入卷首竖题，不再整幅淡出。玩法与 SAVE_V 未动。v83 只改题额化进卷首的那一下，不再落墨换场。玩法与 SAVE_V 未动。v82 只换开场题额和主屏幕图标，玩法与 SAVE_V 未动。线上发布状态以 PR 和 Pages 实测为准。道基循环记在 `s.loop`，不进 traitBag，洗道基时清掉，符箓留下。v1.0 的轮回与仙途志仍写在 `moxian.meta`。v70 的功法与额外速度上限、v71 的人物人生、v72 的红尘、v73 的相裂行迹分别见 README 和 `docs/reviews/`。v74 只改写相裂公告，玩法未动。v75 只让矮桌面窗口里的行藏在笺内滚动。v76 只润色若干奇遇与宗门收束句，玩法未动。v77 只改结算角标：正文还在时不再写成「无事发生」。v78 改演武登台、寄拍件数、渡厄符用语、拍卖 Esc，以及神器志与人物页的未见收束。v79 只打磨观感：墨条略粗、寿元近朱砂不闪、空态留白、奇遇坊市此生所求的暖墨背板、同年日志少重复季节、宽屏行藏离边。v80 只改软体验：平生去重、进货上架后货架不收、上架写明一件、休市不再写开着、晨课来晚时改口、拍卖 Esc 写放弃本件、祠前施药禁用写先回应来人。经营数字与 SAVE_V 未动。

## 这是什么

纯文字修仙。玩家在一卷宣纸上度过一生：吐纳、闭关、游历、破境，间或遇上人、宗门、坊市和天劫。画面是水墨绘卷，不是卡牌，也不是仪表盘。

要跑在 iPhone Safari 上，也要在桌面浏览器上能读。主设备按 iPhone 17 Pro Max 的大约 440×956 来看。视觉质量是第一优先级。功能若和卷面打架，先保卷面。

卷首必须留着这张空灵的构图：

- 远山分层
- 红日贴着左峰
- 右侧孤松
- 湖面上一叶小舟
- 大片留白

题诗在左上，竖排的「纸上仙途」和「问道」印在右，底栏是两枚主笔（开卷 / 续卷）加 2×2（存档、图鉴、日缘、试炼）。右下是声。左缘是公告小印「告」。不要把第五枚按钮塞进 2×2，也不要把小印挪到题诗和红日中间。宽屏（约 700px 起）卷首被收成中间一条，小印用 `position: fixed` 钉在视口左缘，避免落进题诗。

## 仓库怎么摆

纯静态。没有打包步骤，没有 `package.json`。浏览器按 `index.html` 底部的 `<script>` 顺序执行。后面的文件会往前面声明的数组上 `push`（`EVENTS`、`ORGS`、`MISSIONS`），所以顺序就是依赖。

| 路径 | 做什么 |
| --- | --- |
| `index.html` | 页面骨架、关键内联样式 `#crit`、启动失败 `#boot-fail`、service worker 注册、`EXPECT`。脚本标签全在文末。 |
| `css/style.css` | 全部版式。夜墨、遮罩、宽屏、卷首都在这一份里。新样式加在文件末尾，不要改写 v51 遮罩那一段的中间。 |
| `css/fonts.css` | `@font-face` 与 `unicode-range`。由 `tools/fonts.py build` 生成，手改容易和字体文件对不上。 |
| `sw.js` | 离线壳。`CACHE` 必须等于 `EXPECT`。网络优先；坏响应不入库。版本不符会 `skipWaiting` 并刷新一次（`sessionStorage` 键 `mx-heal`）。 |
| `manifest.webmanifest` | 加到主屏幕用的名字、主题色、图标。 |
| `README.md` | 给玩家看的版本摘要。当前缓存号只改最上面那一条，历史行保留。 |
| `js/notices.js` | 公告。`NOTICES` 从新到旧。发版时只往数组最前加一条。 |
| `js/data.js` | `cn` / `cnDur`、境界 `REALMS`、灵根 `LINGGEN`、丹药说明、吐纳闭关文案、`EVENTS` 的起点、狐仙谢礼 `foxGift`。 |
| `js/gongfa.js` | `GONGFA`。品阶、五行、特性 `t`。 |
| `js/gear.js` | 兵器与佩器。 |
| `js/story.js` | 早期奇遇，含门派小比 `xiaobi`。用 `EVENTS.push`。 |
| `js/sect.js` | `ORGS` 里的青冥宗 `qm`、散修盟 `sx`；位阶、同门 `NPCS`、`MISSIONS` 的主干。 |
| `js/baijia.js` | 丹霞谷 `dx`、幽荧殿 `yy`、玄机楼 `xj`，以及各宗任务和藏经阁书单 `LIB_POOL_ORG`。 |
| `js/world.js` | 地点、游历池、地图数据。 |
| `js/tianxia.js` | 大黎仕途：科举、官阶、兵权 / 民心 / 道统。终局里的人皇、权臣从这里长出来。 |
| `js/karma.js` | 跨十年的因果种子、道侣 / 宿敌字段的早期钩子。 |
| `js/life.js` | 此生所求 `GOALS`、心魔、救人变体、绝笔、终卷判词。 |
| `js/juan.js` | 出身 `ORIGINS`、道侣与徒弟、天下大势、卷面题跋。 |
| `js/path.js` | 定型：道基、丹纹、法相、问道、劫纹。 |
| `js/core.js` | 局状态、`migrate`、时间与寿元、战斗结算、任务运行时、物价倍率、`applyFx`。 |
| `js/codec.js` | 存档码，前缀 `MX1`。 |
| `js/slots.js` | 三卷存档，键 `moxian.slots`。旧的 `moxian.v1` 第一次读入时落入第一卷。 |
| `js/samsara.js` | 轮回簿 `moxian.meta`：图鉴、遗泽、日缘、前世 `echoes`。 |
| `js/jianghu.js` | 坊市、拍卖、寄拍、秘境、炼丹、铺子。 |
| `js/folio.js` | 此身与称呼、客卿 / 国师、前世回响事件、道侣日常。模拟器不加载它。 |
| `js/ink.js` | 笔触路径、山形。 |
| `js/ding.js` | 丹炉线稿。 |
| `js/map.js` | 山水长卷地图。 |
| `js/audio.js` | Web Audio 氛围音。偏好键 `moxian.audio`。 |
| `js/fx.js` | 季节、转场、动效开关。 |
| `js/btfx.js` | 破境演出。 |
| `js/fabaoart.js` | 法宝仪式画面。 |
| `js/wallpaper.js` | 卷首壁纸（昼夜、船、鹤）。离开卷首要停。 |
| `js/inkgl.js` | 墨的 WebGL。旧设备会退回画布。 |
| `js/jhui.js` | 江湖界面：坊市、拍卖、秘境、丹炉页。 |
| `js/scrollart.js` | 终卷可以保存的绘卷。 |
| `js/portraits.js` | 人物小像。 |
| `js/game.js` | 界面总控：卷首、日志、抽屉、终卷、主题。最后加载。调试入口是 `window.__moxian`。 |
| `fonts/` | `wenkai-game.woff2`、`wenkai-extra.woff2`（正文 `MoWen`），`mashanzheng.woff2`（标题 `MoShu`），`cao.woff2`（行书 `MoCao`）。都是子集。 |
| `img/realm-0` … `realm-4` | 游玩时每一段卷首的小景，各有 `.avif` / `.webp` / `.png`。画在正文上方单独一条，不压字。 |
| `icon.svg`、`icon-180.png`、`icon-192.png`、`icon-512.png` | 主屏幕图标，山河入卷。 |
| `tools/sim.js` | 无头平衡。看三灵根中位耗时。 |
| `tools/audit_events.js` | 逐事件逐境界查「以强受伤 / 杀鸡得牛」。 |
| `tools/playtest.js` | 迁移、存档码、早期经济。 |
| `tools/regress_xiaobi.js` | 门派小比与重复功法的回归。 |
| `tools/fonts.py` | 字体子集与覆盖审计。 |

`tools/sim.js` 只加载：`data`、`gongfa`、`gear`、`path`、`story`、`sect`、`baijia`、`world`、`tianxia`、`karma`、`life`、`juan`、`core`、`jianghu`。改 `folio.js` 或 `game.js` 不会反映在中位数里。

## 本地怎么跑、怎么测

在仓库根目录：

```
python3 -m http.server 8765
```

打开 `http://127.0.0.1:8765/`。用 `file://` 时 service worker 不会注册，这是预期的。改完静态文件，刷新即可，不必构建。

浏览器控制台里，`window.__moxian.openEvent('wolf')` 可以按 id 打开一条奇遇。`__moxian.S` 是当前局。

常用检查：

```
node --check js/game.js
node tools/sim.js 200 balanced
node tools/audit_events.js
node tools/playtest.js
node tools/regress_xiaobi.js
python3 tools/fonts.py audit
```

`sim.js` 的第一个参数是每个灵根的局数，第二个是策略：`balanced`、`grinder`、`wanderer`、`tapper`。不写策略会把四种都跑一遍；默认局数是 2000，很慢。日常看 `200 balanced` 就够。要看的是表里三灵根那一行的「全体用时中位(分)」，落在大约 70–85。`audit_events.js` 退出码非 0 就是有违例。

改了 CSS 的花括号之后，数一遍 `{` 和 `}` 是否成对。这一份样式很长，一处没合上，后面的夜墨和宽屏会整段失效。

## 部署

GitHub Pages，源是 `main` 分支的根目录。地址：

https://loser-gif.github.io/xiuxian-ink/

仓库：`loser-gif/xiuxian-ink`。

合进 `main` 之后等 Pages 自己更新，通常几十秒到几分钟。用无缓存请求看，不要假设一 push 就生效：

```
curl -fsS -H 'Cache-Control: no-cache' https://loser-gif.github.io/xiuxian-ink/index.html | grep -o 'v=[0-9]*' | sort | uniq -c
curl -fsS -H 'Cache-Control: no-cache' https://loser-gif.github.io/xiuxian-ink/sw.js | head -n 5
```

页面上的 `EXPECT` 和 `sw.js` 里的 `CACHE` 必须同为 `moxian-vN`。对不上时，已打开的客户端会一直刷新。不要调用 GitHub Pages 的 rebuild 接口，这个仓库的令牌没有那项权限。

## 发版步骤

只有玩家能看见的改动才升缓存。只改文档时，停在这一节，不要动 `?v=`。

设新号为 N（当前是 104，下一版就是 105）。下面每处都写成 N：

1. `index.html`：`var EXPECT = 'moxian-vN'`，以及文件里全部 `?v=`（含 `sw.js?v=`、样式、脚本、图片）。
2. `sw.js`：`var CACHE = 'moxian-vN'`，预缓存列表里的 `?v=`。
3. `js/game.js`：`navigator.serviceWorker.register('./sw.js?v=N')`。
4. `css/fonts.css` 里的字体地址。字体文件若没重做，只改查询串，让旧缓存失效。
5. `manifest.webmanifest` 的图标地址。
6. `README.md` 最上方当前缓存那一行。更早的 `?v=35`、`?v=16` 之类是历史，留着。

然后打开 `js/notices.js`，在 `NOTICES` 数组最前面插入一条：

```js
{
  v: 55,
  date: '2026-10-21',
  items: [
    '用玩家能懂的一句短话。',
  ],
},
```

`date` 是亚洲/上海的日历日，写成 `YYYY-MM-DD`。界面会用 `cn()` 显示成「二千零二十六年十月二十一日」。`items` 写给玩家，不写 CSS、缓存、localStorage。一条可以覆盖更早几版时，加 `to: 45`，卷上会写成「v47 · 至 v45」。

合进 `main` 后：

```
curl -fsS -H 'Cache-Control: no-cache' https://loser-gif.github.io/xiuxian-ink/index.html | grep -o 'v=N'
curl -fsS -H 'Cache-Control: no-cache' https://loser-gif.github.io/xiuxian-ink/sw.js | grep moxian-vN
```

两处都要出现新号。`index.html` 和 `sw.js` 里不能再有上一版的 `moxian-v`。`js/notices.js` 也要能直接打开，并且第一条的 `v` 就是 N。

已读版本存在 `moxian.notice`。玩家打开公告时写成最新的 `v`。下一版再往前加一条，印角的朱砂会重新出现。

## 存档与迁移

| 键 | 谁在写 | 里面是什么 |
| --- | --- | --- |
| `moxian.v1` | `js/game.js` 的 `save()`，`js/slots.js` 的 `LEGACY` | 单卷旧档。新局也会写它，三卷的盒子在另一键。 |
| `moxian.slots` | `js/slots.js` | 三卷。每卷有摘要和整局数据。 |
| `moxian.look` | `applyLook` | `{ theme, font, motion }`。`theme` 为 `auto` / `day` / `night`。 |
| `moxian.notice` | `openNotice` | 字符串，例如 `"54"`。 |
| `moxian.meta` | `js/samsara.js` | 图鉴、遗泽、前世 `echoes`（最多 16 条）。 |
| `moxian.legacy` | 轮回 | 下一世开局用的残页、悟性、印记。 |
| `moxian.audio` | `js/audio.js` | 声的开关和音量。 |

存档码是 `MX1.` 加压缩正文。导入导出都走 `js/codec.js`。前缀改了，玩家手里的码就废了。

`Core.migrate` 从 `s.v === 1` 一直走到 13。走到最后若仍不等于 `SAVE_V`，返回 `null`，这局等于没了。所以：

- 只是多一个字段：在 `migrate` 成功路径的末尾补默认值。`xwBank`、`who`、铺子、客卿、前世钩子都是这样补的，没有抬 `SAVE_V`。
- 公式变了、旧数字会对不上：写 `if (s.v === 13) { s.v = 14; ... }`，把 `SAVE_V` 改成 14。寿元按旧值保底，只增不减。修为倍率若没改，不要按比例重算 `xw`。

`Folio.ensure`、`Life.ensure`、`Juan.ensure` 会在迁移末尾补各自的空结构。新系统优先加在自己的 `ensure` 里。

## 怎么加一条内容

文案用玩家能读的中文。数字和 id 用英文标识。新汉字要过字体审计。

### 奇遇

奇遇就是 `EVENTS` 里的一条。`js/data.js` 创建数组，`js/story.js`、`js/juan.js`、`js/folio.js` 等往后 `push`。游历时 `Core.pickEvent` 按境界、`once`、`cond`、权重 `w` 来抽。最近 8 条会避开。

最小的一条，放在 `data.js` 已经执行之后的文件里：

```js
EVENTS.push({
  id: 'bridge_tea',
  title: '桥头茶摊',
  w: 4,
  rm: [0, 2],
  once: true,
  text: () => '桥头茶摊把一杯凉茶推到你手边。山风大，茶是热的。',
  choices: () => [
    { label: '坐下喝完', act: () => ({ text: '茶是粗茶。你喝完，把杯子推回去。', fx: { xj: 2, time: 1 } }) },
    { label: '道谢离开', act: () => ({ text: '你拱了拱手，没有坐下。', fx: {} }) },
  ],
});
```

字段：

- `id`：全局唯一。`s.seen[id]` 记次数。
- `w`：权重。稀有的用 2 左右，常见的 6–9。也可以写成 `wf: s => 数字`。
- `rm: [最低境, 最高境]`：0 炼气 … 4 化神。不写则全境。
- `once: true`：见过就不再进池。
- `cond: s => 布尔`：额外门槛。不要在 `cond` 里改状态。
- `title`、`text`：字符串或 `s => 字符串`。
- `choices`：数组或函数。每项有 `label`、可选 `sub`、`act`。`act` 返回 `{ text, fx }`。

`fx` 交给 `Core.applyFx`。常用：`xw`（按当前境界所需的比例）、`ls`、`life`（年）、`xj`、`wx`、`luck`、`inj`、`item`、`gf`、`gfXp`、`gx`、`npc`、`time`（月）、`flag`、`heart`、`btBuff`。`ls` 和 `life` 默认再乘境界倍率（`lsScale`、`LIFE_SCALE`）。已经是最终数字时加上 `lsRaw: true` 或 `lifeRaw: true`。

`disabled` 必须是布尔。`openEvent` 里是 `b.disabled = !!c.disabled`，写成函数会永远禁用。

有对手时，在 `text` 里先调用 `Core.showFoe(s, { realm, stage }` 或 `{ rel }`，再写正文。选项上放 `odds`（0–1 的函数或数字），结算用 `Core.fightAct`。胜算会收成选项右侧四个字。参考 `js/story.js` 的 `wolf`。

会让人受伤、但其实没有敌人的事件（雷、炉、心魔、自己摔下去），把 `id` 加进 `tools/audit_events.js` 的 `HAZARD`，否则审计会把它当成「以强受伤」。

### 宗门任务

任务不进 `EVENTS`。写进 `js/sect.js` 的 `MISSIONS`，或在 `js/baijia.js` 里追加。运行时由 `Core.missionEvent` 包成一张卡，卡上会显示耗时、风险、贡献、灵石。

```js
{ id: 'songcha', name: '送一壶茶', seal: '茶', rank: [0, 2], rm: [0, 1], m: 1, risk: 0.08, gx: 8, ls: 3, w: 6,
  brief: '师父峰上缺一壶新茶，限你走一趟。',
  text: () => '执事把一只温壶塞进你手里。路不远，壶盖却盖不严。',
  choices: () => [
    { label: '双手捧着走', risk: -0.04, gxm: 1,
      ok: '茶还是热的。师父没说话，只多看了你一眼。',
      fail: '半路绊了一下，茶洒了半壶。执事皱眉，仍给你记了一小功。' },
  ] },
```

`m` 是季数，不是境界的 `T`。实际月数由 `Core.missionSpan` 再乘一点境界拉伸。`risk` 是失败率基数，选项上的 `risk` 是加减。`gx`、`ls` 会按境界放大。同门选项先用 `Core.npcAlive(s, id)` 判断人还在不在。会打起来的任务设 `fight: true`，正文里 `Core.showFoe`。没有敌人却会 `inj` 的，用 `任务:` 加 id 登记进 `HAZARD`（现有例子是 `任务:caiyao`）。

### 功法

在 `js/gongfa.js` 的 `GONGFA` 里加一条。`grade` 0–3 对应凡灵地天。`t` 里可用 `spd`、`dunwu`、`xinmo`、`time`、`life`、`bt`、`btXj`、`qiyu`、`heal`、`xjGain`、`mo`。

```js
songcha_gf: { name: '松下煮茶诀', el: '木', grade: 0, src: '师父峰',
  desc: '把呼吸煮成一壶很慢的茶。快不了，心倒稳。',
  t: { xinmo: 0.85 }, trait: '心魔略减' },
```

想让藏经阁能换，把 id 放进 `LIB_POOL` 或该宗的 `LIB_POOL_ORG`。贡献价格按品阶走 `LIB_COST`，这份价格不随境界放大。功法名里的新字要进字体子集。

### 心魔

心魔不是一条普通奇遇。破境前 `Life.xinmoEvent` 生成 `id` 为 `xinmo_r` 加境界的事件。三种选择固定：说完、不许再提、随口应了。文案在 `Life.xinmoLines`，按境界 0–4 各有若干句，用 `xinmoFacts` 里的所求、道侣、宿敌、宗门、出身、暗伤和旧事。

加变体时，往对应境界的数组里再推一句字符串，用上已有的 `f.mate`、`f.goal`、`f.quote` 这类事实。不要改那三个 `label`。心魔会受伤，它的 id 形态要继续被审计当成没有敌手的危险，而不是一场斗法。

### 结局

现有 `ending`：`ascend` 飞升、`zuohua` 坐化、`rumo` 入魔、`guiyin` 归隐、`bingjie` 兵解、`yunluo` 身殒、`renhuang` 人皇、`quancheng` 权臣、`huashen` 山神、`zhenmo` 镇魔、`chuanshuo` 传说。

终卷由 `showEnd(kind)` 画。文案在 `js/game.js` 的 `T`，画心在 `END_ART`。判词由 `Life.compose` / `Life.judgeLine` 接在后面。非试炼局会 `Samsara.recordLife`，写入轮回簿和前世回响。

新结局要同时动：触发处设 `s.ending`（以及 `s.dead` 或 `s.ascended`）、`T`、`END_ART`、若所求要认这个结局则改 `GOALS` 的 `judge`。终卷标题用行书时，把那几个字加进 `tools/fonts.py` 的 `CAO_TEXT` 再 `build`。

### 此生所求

八个愿在 `js/life.js` 的 `GOALS`：`changsheng`、`wendao`、`niantou`、`xuechou`、`shouyi`、`diwei`、`zhangmen`、`qingshi`。旧 id `xiaoyao` 经 `GOAL_ALIAS` 收进 `niantou`。不要删掉旧 id，玩家档里可能还存着。

```js
{ id: 'example', name: '例子', seal: '例', hint: '一句玩家能懂的达成条件',
  judge: s => s.ending === 'guiyin',
  coda: ok => ok ? '此生所求「例子」。这一愿在卷终合上了。' : '此生所求「例子」。卷终了，愿还悬着。' },
```

`judge` 在终卷调用。`achieved()` 会先做别名。开局的选择器读的就是这个数组，加一条，卷首那一屏会多一格，要在 440 和 375 上看它还挤不挤，遮罩还透不透字。

## 系统总览

境界在 `REALMS`：炼气、筑基、金丹、元婴、化神，然后飞升。每境有 `life`（寿元底）、`T`（时间刻度）、`lsScale`（灵石倍率，大约 1 / 3 / 8 / 20 / 50）、`pill`（破境丹名）。寿元是境界底数加功法、丹药和 `lifeBonus`。时间以月计，界面用 `cnDur`。

灵根 `LINGGEN`：天、异、双、三、四、伪。平衡以三灵根、策略 `balanced` 为准。伪灵根开局进散修盟或无门。

宗门：青冥宗、丹霞谷、幽荧殿、玄机楼、散修盟，也可无门。位阶七档，晋升看累计贡献 `gx` 和境界，见 `RANK_REQ`。青冥的名字是杂役到掌门；散修盟是散人到盟主。俸禄、灵脉闭关、藏经阁层数随位阶变。大比是攻 / 守 / 术 / 奇 的短对局。

同门在 `NPCS`。情谊是 `s.npc[id].a`。人死了要 `Core.killNpc`，判断用 `Core.npcAlive`。`known` 仍表示「见过」，见过和还活着是两件事。道侣可在天劫里用替劫符、护脉丹一类替一次，见 `spendSaveItem`。

此身在开卷选定，`s.who = { sex: 'm'|'f'|'n', mate: 'm'|'f'|'any' }`。旧档没有 `sex` 时，称呼保持「师兄」。`Folio.dress` 只把该换的「师兄」换成「师姐」或「同门」，器房师兄、青袍师兄、守炉师兄、机纹师兄、丹房师姐、殿中师姐这些职称留着。不要全局替换「他 / 她」。道侣意向：没选过的旧档只遇女性线；`any` 两边都可；男性线的人是 `bai` 江疏白。

客卿在 `folio.js`。`s.keq.rank`：`-1` 未入、`0` 客卿、`1` 国师、`-2` 除名。它不写 `court.rank`，也不改宗门贡献。供奉按境界的月数发放。失败累到三次会被除名。

坊市买卖、听雨楼拍卖、寄拍仍在 `jianghu.js`（`auc.hold`，落槌后玩家拿大约八成）。v72 铺子由 `redworld.js` 接替，`Jianghu.shop*` 只保留转接，不再有自动 `shopTick`。主动经营吃一次游历的光阴，休市不收后续租金；开季才续过期租约。旧买断保留免租，旧租约与货架原样迁入。`Redworld.quote` 和 `season` 用同一套价格；上限为本境聚气丹街价乘店数（主店也计一间，最多三间）。不能整件售出的高价货留架，不强行截价出售。独立口碑、正邪、道果、香火、欠账、四十笔账本都在 `s.shop`，不进轮回。新增结局 `hongchen` 只在化神末门出现；规范与数值见 `docs/REDWORLD_RUN.md`。

试炼从卷首「试炼」进。开局前有一张说明笺：金丹初期、二十载、灵石 120、修为 0。局上有试炼印。试炼不把前世回响写进下一卷。日缘要求已经有一卷活着的局，一天领一次，走 `Samsara.claimDaily`。

前世：终卷（非试炼）往 `moxian.meta.echoes` 压一条短记录。下一局 `Folio.seed` 最多挂两种钩子，例如山神、道侣、宿敌、宗门、法宝、飞升、诏、旧洞、残愿、空船。对应稀有事件 `echo_*`。

轮回簿 / 图鉴在 `moxian.meta.atlas`，卷首「图鉴」打开。遗泽（悟性、残魂、残页、门派印、皇命、旧洞）在开新局时由 `Samsara.applyLegacy` 用掉。

定型在破境时选，存在 `s.path`。道基可高代价洗去。本命法宝走认主、开光、祭炼、化形；身死可留残魂给下一世。

## 视觉

颜色在 `css/style.css` 的 `:root`：

- 纸 `--paper` `#efe6d3`，亮纸 `--paper-hi` `#f7f1e3`
- 墨 `--ink` `#1b1814`，次墨 `--ink2` `#38322b`，淡墨 `--ink3` `#6e6457`
- 朱砂 `--zhu` `#b3302a`
- 夜：页面底 `#14110e` 左右，字改浅色 `#f0e6d6`
- 夜墨下的宣纸（`.sheet-panel`、`.hpaper`、`.mj`、`.dan`、`.end-paper` 等）把 `--ink` 设回 `#1c1814`，否则浅字写在浅纸上。

字体：

- `MoWen`：霞鹜文楷，正文。
- `MoShu`：马善政楷书，标题、按钮、印章。
- `MoCao`：志莽行书，终卷大字和少量仪式。缺字会落到楷书。

墨的习惯：笔触按钮（`.brush-btn`）、朱印、自下而上的抽屉 `openSheet`、居中的确认 `inkConfirm`、定型仪式 `.path-cer`。点按目标大约 44px。遮罩用实色压住底下的字（v51 那一段，含 `.sheet-shade`、`.modal-shade`、`.path-cer-shade`）。夜色遮罩更深。拍卖台 `.auc` 和定型仪式面板保持深色，不要刷成宣纸。

昼夜存在 `html[data-theme]`，由 `moxian.look` 和系统偏好决定。季节是 `body[data-season]`，卷首和游玩都有淡的季相，不要另做一套高饱和滤镜。动效听 `prefers-reduced-motion`，也听纸墨里的「简」（`data-motion=lite` / `data-fx=thin`）。简动效时关掉整屏模糊和长时间循环。

iOS 上要省：

- 卷首壁纸在离开标题或切到后台时暂停。
- 画布有像素上限，不要按设备满 DPR 无界放大。
- 不用 `backdrop-filter`。
- 不用 `writing-mode: vertical-rl`。旧 WebKit 会把竖排字裁掉左半。
- 关键 CSS 必须留在 `index.html` 的 `#crit`。样式没到时，玩家会看到「墨未落成」和重试，而不是空白页上两只鹤。检测条件是 `#app` 的计算位置还不是 `fixed`。所以 `#crit` 里写成 `relative`，`style.css` 里写成 `fixed`。不要把这层探测改掉。
- `#splash` 在关键 CSS 里是 `display: none`。正式样式才会把它打开。截图若停在启动「纸」上，是还没等到 `splash` 隐藏、`body` 有 `go` 且没有 `hold`。

抽屉、终卷、秘境这些纸面在 1280 / 1440 / 1800 有最大宽度，避免一行拉得过长。宽屏三栏是玩法页的事；卷首仍然要疏，不要为了填白而加模块。

## 截图与验收

改了版式或文案，至少看这些尺寸，昼和夜都要：

| 视口 | 说明 |
| --- | --- |
| 440×956，DPR 3 | 主设备。安全区上下都看一眼。 |
| 390×844 | 常见手机宽。 |
| 375×812 | 选项和日期最容易折行的宽度。 |
| 1280×800 | 宽屏规则开始生效。 |
| 1440×900 | 三栏和居中纸笺。 |
| 1920×1080 | 留白是否还像一幅画，而不是一条细内容漂在中间。 |

验收时看：

- 卷首疏密：题诗、红日、松、舟、菜单、声、告印互不压住。
- 告印在未读时有朱砂点；打开公告后 `localStorage['moxian.notice']` 变成最新版号，点消失。
- 夜墨下秘境、丹炉、抽屉、终卷的字是深墨写在浅纸上。
- 有对手的选项，胜算是右侧短四字，375 上也不折成两行。
- 此生所求的底是实的，底下日志透不上来。
- 试炼先出说明笺，再进金丹二十载。截图要等笺出现，不要截启动的「纸」。
- 新开一局在题名入卷转场结束约 450 毫秒后会弹此生所求。要拍玩法时，先把 `life.goal` 设上，或点选后确认，再截。
- 无头浏览器里动画常常要等一次截图才往前走。等 `inkWrite` 这类逐字时，先截一张丢掉，再等条件。

给别人看的图用 JPEG，压到 1MB 以内。文件太小（大约十几 KB）通常是只截到了启动页。

## 已知问题与还没做完的线

这些是交接时的判断，不是要在本文里改代码。

物价按境界重排过（丹药、功法售价、俸禄、拍卖起拍随 `lsScale`；藏经阁 `LIB_COST` 不随境界涨；坊市还有大约 0.62–1.6 的浮动）。数字在模拟里能跑通，还没有真人长局来确认手感。改物价之前先打一两局，再动 `ITEM_VAL`、`GF_SELL` 和俸禄表。

v72 已移除旧铺自动售货。若经营灵石异常，先核对 `Redworld.quote`、参与店数与账本的实际现金支出。自备货参考价不能伪记成已付成本；香火冷却按 144 个实际月，不按境界缩短。不要用经营问题去改修炼速度。

客卿和计划中的王朝线叠在一起。大黎入仕、官阶、人皇 / 权臣终局已经在 `js/tianxia.js`，卷首所求里也有「登帝位」。客卿是另一条不入朝的供奉，故意不写 `court.rank`。再加朝廷内容时，先分清「朝中的官」和「山外的客卿」，避免两套俸禄和两套称呼叠在同一个人身上。王朝线仍可以继续长：入仕的摩擦、称帝之后的日常，现在都还薄。

因果已经有种子和十余年后的回响（`js/karma.js`）。v1.0 把图鉴收成仙途志，奈何只许带一样，都写在既有的 `moxian.meta`，不要再开一个存档键。旧的整包遗泽只对更新前已经写下、还没开的下一卷生效一次。

桌面大屏的留白是卷首想要的，玩法页则不该空成一条窄纸。`style.css` 末尾对 1280 / 1440 / 1800 收了卷轴和抽屉的宽度。若 1920 的游玩页两侧仍然空得读起来费劲，加宽的是中间纸，不是卷首的山。

其它容易再犯的点：

- 选项 `disabled` 写成函数，按钮会一直灰。
- 寿元、灵石忘了 `lifeRaw` / `lsRaw`，高境界会乘出另一个数。界面上的字和实扣必须同源，走 `Core.scaleLife`、`scaleLs`、`tollText`。
- 人死后仍用「见过」来触发道侣事件。要用 `npcAlive`。
- 夜墨只改了全局 `--ink`，忘了宣纸面板，秘境和丹炉会变成浅字。
- 为了省事删掉卷首笔锋、卷首小景、试炼笺、胜算四字或压实遮罩。这些都是玩家已经在用的样子。
- 模拟中位数看起来没变，但你改的是 `folio.js`。那部分要亲手开一局看。
