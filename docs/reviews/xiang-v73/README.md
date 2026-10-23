# v73 相裂另记

issue #47 里「法相回首」做完后，行迹仍挂着「将至 · 法相 · 因果」。核对后这是两件事，不是同一笔没结算完。

- 定法相时 `choosePath` 种下 `xiang_fan`。到期后只在云海天阶、古修洞府、青冥山门触发「相裂」，选洗相或压下裂痕后才 `karmaTake`，行迹记已了。
- `mark_faxiang`（法相回首）只记功课，心境 ±，不清种子。回首正文和结算写明：这不是相裂，因果还在。
- 行迹名称由「法相」改为「相裂」，详情写明与回首不是同一件事，以及去处和期限。
- 洗去法相，或读档时已经不再持相，未上门的种子标成已消，不再永久将至。已经面对过相裂的仍是已了。之后若重新定相，会另种一笔新的伏笔，不沿用旧的到期日。
- 宽屏右栏的行迹行可以点开详情，不再只能在窄屏展开。点行迹以外的位置仍是去游历。

SAVE_V 仍是 16。存档键与 MX1 未改。修炼、物价、任务、战斗数值未改。

## 验收

- `node --check`：`karma.js`、`core.js`、`loops.js`、`game.js`、`notices.js`、`tools/regress_xiang.js`。
- `node tools/regress_xiang.js`：回首后种子仍在且文案分开；到期为将至；压下裂痕为已了；洗相与旧档不再持相为已消；再定相是新的伏笔；相裂半价洗相成功仍已了；灵石不足时法相还在、行迹已了。
- 相关 regress、`playtest.js`、`audit_events.js` 通过。事件 224、任务 37、秘境节点 27，敌我结算无「以强受伤」。
- `node tools/sim.js 600 balanced`：三灵根全体用时中位 82.1 分钟（飞升中位 82.7）。敌我 54954 次，以强受伤 0。见 `balance.txt`。
- `python3 tools/fonts.py audit`：缺字 0。见 `font-audit.txt`。

## 截图

定向卷：三灵根、雷相，回首前把相裂调到将至。无横向溢出，页面异常 0。

- `440-day-main.jpg`：窄屏行迹摘要「将至1」。
- `440-day-huishou.jpg`、`440-day-huishou-result.jpg`：回首写明只是功课，结算写相裂仍在并给出去处。
- `440-day-trace-due.jpg`、`1440-day-side.jpg`、`1440-day-trace-due.jpg`：将至 · 相裂，详情与回首分开。
- `440-day-trace-done.jpg`：面对相裂并压下裂痕后为已了。
- `440-night-trace-gone.jpg`、`768-night-side-gone.jpg`、`768-night-trace-gone.jpg`：洗相后为已消，不再挂将至。

未关 issue #47。那一条里还有寄拍、耗时和其他体验项，本批只收口法相回首与相裂行迹。
