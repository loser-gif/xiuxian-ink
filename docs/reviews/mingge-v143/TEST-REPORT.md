# 命格绘卷 · 复核测试报告

Cloud Agent 执行，不是 Codex CLI。没有安装 Codex CLI。未合并，未部署。PR 仍是 https://github.com/loser-gif/xiuxian-ink/pull/129 。

分支 `cursor/mingge-text-opening-d9b0`。复核前 HEAD `8bb11ce67e4a896254017e8429cb909f3412c645`。本报告随复核提交一起入库，精确 HEAD 以提交后的 `git rev-parse HEAD` 为准，并写在 PR 说明里。

缓存 `moxian-v143`。`SAVE_V` 16。

视口是无头 Chrome（`/usr/bin/google-chrome-stable`），不是 iPhone 真机。

## 命令和结果

| 命令 | 结果 |
| --- | --- |
| `node tools/regress_mingge.js` | 通过。含落印状态上的挡伤、早夭、三路、抓周对照和奇遇结算。 |
| `node tools/regress_mingge_browser.js` | 通过。见下面的浏览器项。 |
| `node tools/audit_events.js` | 无违例。事件 242，结算 117246 次。 |
| `node tools/sim.js 200 balanced` | 三灵根全体用时中位 81.9 分。这组模拟不带序章加成，只说明旧公式没被改坏，不能代替下面的冒烟。 |
| `python3 tools/fonts.py audit` | 通过。MoWen、MoShu、MoCao 缺字 0。 |

CI：打开 PR 时没有回报检查。本次推送后若仍无检查，不能称为全绿。

## 寿元和体魄（从落印状态测，不是手贴标签）

`begin()` 走 `Core.newState` + `Mingge.apply`，和 `newGame` 同一条写入。

炼气自然寿元：三灵根对照局 `plainLife.lifespan > 80`。红尘落印局 `lifespan === 80`，`dustDue === 80`，`lifeBonus === 0`。

- 男命、古玉、无断剑：1 点伤结算后伤势为 0；2 点伤仍是 2。断言 `male-light-wound`、`male-heavy-stays`。
- 女命、断剑：2 点伤结算后为 1，寿元加成 0。断言 `sword-soak`。
- 红尘注视中破境把握低于解开之后，差值大于 0.04。断言 `dust-bt-pressure`。
- 一直不筑基、不祭炼：年龄走到 80 以上、不到 88 时坐化。断言 `dust-dies-at-cap`。
- 把本命 `stage` 设到 2 再 `sync`：`dustLifted === 1`，寿元回到 80 以上。断言 `dust-lift-fabao`。
- 境界改到筑基再 `sync`：`dustLifted === 1`，寿元大于 150。断言 `dust-lift-realm`。
- 没有命格的对照局同样往前走 65 年，人还活着，`ming.on` 为空。断言 `old-path-outlives-dust`。

## 抓周和三路短程

同一套三灵根底子：

- 古玉男：灵石比抓空气至少多 80，抓空气灵石为 0，古玉气运不低于抓空气。各吐纳 24 次，两边都活着且都有修为，古玉灵石仍然更多。断言 `grab-gap`、`grab-smoke-alive`。
- 宗门女、散修男、红尘女各吐纳 12 次都活着。宗门有 `qm`，散修无门，红尘寿元仍是 80。断言 `three-paths-alive`。

## 后续机制（条件与结果）

全部在落印后的 `S` 上调用事件 `cond` 和 `act`，再用 `Core.applyFx` 记账。

| 事件 | 触发条件 | 结果 |
| --- | --- | --- |
| `ming_taixu` | 落印选择无字天书，`ming.taixu` | `cond` 为真。选「顺着灯走」后修为上升，`flags.taixuMet === 1`。 |
| `ming_qian` | `ming.sex === 'm'` | 浏览器打开事件，标题含「元阳」，选项含「双修」。 |
| `ming_dual_m` | 已选「问起双修」，`setMate` 江疏白且 `met`，境界到筑基 | `cond` 为真。同修后修为上升。 |
| `ming_kun` | `ming.sex === 'f'` | 宗门局贡献增加且得到宁神花。无门的红尘局得到宁神花，灵石不减。浏览器标题「坤灵」，选项含「听她讲」。 |
| `echo_mingfox` | 放生，deed `mingfox` 到期前为假；把月份拨到 `due` 后为真 | 收下后得到古剑残片或聚气丹。 |
| `ming_cruel` | 剥皮，行囊有「百年狐皮」 | `cond` 为真。 |
| `ming_cave` | 满门祸起 | 安顿后灵石增加，`mingCaveHome === 1`。 |
| `ming_bounty` | 同上 | 抽身退开后因果 `karma_done_ming_bounty` 或心境变化。 |
| `ming_scroll` | 同上 | 照着练一夜后修为上升。 |
| 本命与注视 | 红尘落印即有 `fabao.stage === 0` | 见上表的解开与坐化。 |

## 不穿透旧档

- `Mingge.apply` 第二次返回 `dup`，狐皮数量和寿元不加。断言 `apply-dup`、`no-stack-coat`。
- 旧局 `migrate` 后 `ming.on === 0`，没有男命奇遇。断言 `old-ming`、`old-no-qian`。
- 来世只 `newState`、不 `apply`：寿元大于 80，没有狐皮，1 点伤不会被化掉。断言 `next-life-clean`、`next-life-no-soak`。
- 浏览器：作罢后仍在卷首，槽位数 0，雨声标记 `off`。满槽点「且慢」后没有命格层。续卷名是「沈试」，不再出现命格层。试炼创角页有「不言」，性别没有被锁死。
- 引雷文案在返回后再进，两段正文相同，且是「雷根醒了」或「雷未入体」之一。

## 纸面

桌面 1440×900，从出生确认进入落地页时：

```json
{
  "color": "rgb(74, 67, 58)",
  "opacity": "1",
  "fontSize": "17px",
  "nodes": ["text"],
  "frames": 8,
  "ink": true,
  "choices": 2
}
```

正文是纯文本节点，没有单独的淡字元素。`frames: 8` 且 `ink: true` 表示阶段之间的落墨动画在画。选项仍是 2 个，动画没有替玩家确认。

减动态下再确认一步：`frames === 0`，选项仍是 2，颜色仍是 `rgb(74, 67, 58)`，透明度 `1`。断言 `reduced-does-not-skip-choice`。

手机 390×844 抓周页无横向溢出、无插画、墨色相同。夜墨下命格层墨色仍是 `rgb(74, 67, 58)`。

截图目录 `/opt/cursor/artifacts/`：`desktop-birth.jpg`、`desktop-stage-ink.jpg`、`desktop-book.jpg`、`desktop-main.jpg`、`mobile-sex.jpg`、`reduced-birth.jpg`、`night-birth.jpg`、`trial-create.jpg`、`computed-style.json`。

## 离线壳

浏览器里重新注册 `./sw.js?v=143` 后，缓存键里能找到带 `v=143` 的 `mingge.js`。断言 `sw-has-mingge`。
