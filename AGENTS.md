# 纸上仙途 · 给 AI 的短规矩

先读仓库根目录的 `HANDOVER.md`。那是完整交接。这里只放会改坏游戏的硬规矩。改规矩时，`AGENTS.md`、`CLAUDE.md`、`.cursorrules` 三份一起改。

对外名字是「纸上仙途」。源码注释里的「墨仙录」是同一份代码。纯静态页，无构建。线上从 `main` 发到 GitHub Pages：https://loser-gif.github.io/xiuxian-ink/

## 视觉

视觉质量高于功能。卷首保持空灵：远山、红日贴左峰、孤松、湖面小舟、大片留白。题诗在左上，竖题在右，底栏是 2×2（存档 / 图鉴 / 日缘 / 试炼），声在右下，公告小印在左缘。不要往 2×2 里塞第五枚，不要把印放到题诗和红日中间。

竖排用 `.vt` / `.vcol` 逐字堆叠。不要用 `writing-mode`。不要用 `backdrop-filter`。遮罩保持压实（`css/style.css` 里 v51 那段实色）。宣纸面板在夜墨下把 `--ink` 设回深色。关键内联样式 `#crit` 里的 `#app` 必须保持 `position: relative`，真正的 `position: fixed` 只写在 `css/style.css`，否则「样式没载入」的检测会失效。

## 存档

不要改这些键，也不要改存档码前缀：

- `moxian.v1`（`SAVE_KEY`，旧档仍会读）
- `moxian.slots`（三卷）
- `moxian.look`（昼夜 / 字号 / 动效）
- `moxian.notice`（公告已读到的版本号）
- `MX1`（`js/codec.js`）

另外已有、不要随手改名：`moxian.meta`、`moxian.legacy`、`moxian.audio`。

旧档必须能打开。`js/core.js` 的 `SAVE_V` 现为 13。`migrate` 末尾若 `s.v !== SAVE_V` 会直接丢掉存档。新字段用默认值补上，不要为了加字段去抬 `SAVE_V`。真要抬版本，就写一段 `if (s.v === N)` 的迁移，寿元只增不减，修为倍率没变就不要重算修为。

## 兼容

玩法脚本保持 ES2020，能在大约 Chrome 80 / Safari 14 上跑。不要在 `js/data.js`、`js/story.js`、`js/life.js`、`js/core.js` 这类必载脚本里新写 `?.`、`??`、私有字段、顶层 `await`。脚本一语法错误，鸿蒙等旧内核会只剩两只大鹤。`#boot-fail` 和 service worker 的坏响应拒收要留着。

## 平衡与字体

改了修炼、物价、任务、战斗之后跑：

```
node tools/sim.js 200 balanced
```

三灵根 `balanced` 的全体用时中位要落在大约 70–85 分钟。再跑 `node tools/audit_events.js`，违例应为 0。`tools/sim.js` 不加载 `folio.js`、`game.js`、`notices.js`，客卿、此身、公告不进这个中位数。

凡是新增汉字，跑 `python3 tools/fonts.py audit`。缺字就用 `python3 tools/fonts.py build` 重做子集（源字体在 `FONTSRC`，默认 `/workspace/fontsrc`）。终卷大字若用行书，还要写进 `tools/fonts.py` 的 `CAO_TEXT`。

## 发版

只有玩法或表现要给玩家时才升缓存。文档改动不要升 `?v=`。升的时候下面几处必须是同一个 N，`index.html` 的 `EXPECT` 必须等于 `sw.js` 的 `CACHE`（`moxian-vN`），否则 service worker 会不停刷新：

- `index.html`：`EXPECT`，以及全部 `?v=`
- `sw.js`：`CACHE` 与预缓存地址
- `js/game.js` 里的 `sw.js?v=`
- `css/fonts.css`、`manifest.webmanifest`
- `README.md` 里当前那一行缓存号（更早的历史行留着）

然后在 `js/notices.js` 的 `NOTICES` 最前面加一条。`date` 用亚洲/上海的日历日 `YYYY-MM-DD`。`items` 写给玩家的短句，不写做法。合进 `main` 之后用无缓存请求核对：

```
curl -fsS -H 'Cache-Control: no-cache' https://loser-gif.github.io/xiuxian-ink/index.html | grep -o 'v=N'
curl -fsS -H 'Cache-Control: no-cache' https://loser-gif.github.io/xiuxian-ink/sw.js | grep moxian-vN
```

两处都要是新号，页面上不能再留下一版的 `moxian-v`。

## 写内容时

- 选项的 `disabled` 必须是布尔值。函数永远会被当成真。
- 有对手的选项：正文里先 `Core.showFoe`，选项上放 `odds`。胜算文案要收成右侧四个字，不要折行。
- 灵石、寿元若已经是最终数字，带上 `lsRaw` / `lifeRaw`，否则会再乘境界倍率。
- 道侣、同门是否还在，用 `Core.npcAlive`。人死了就不要再让相关事上门。
- 新的受伤事件若其实没有敌人（天灾、丹炉、心魔），把 id 登记进 `tools/audit_events.js` 的 `HAZARD`。
