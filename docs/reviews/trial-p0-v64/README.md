# v64 试炼与闭关验收

基于 main `f4cf3a2`（v63）。用户确认目标为二十载内达到金丹中期。

## 行为

- 新试炼与缺定型的旧试炼复用现有仪式补选道基、丹纹，开局仍为 480 月，不额外花时间。
- 目标达到即收卷。按行动完成时的月数判定，恰满二十载可以成功，超过期限不计成功；长行动完整结算，越期闭关在按钮及日志提示。
- 主界面显示目标与余时；成功、超时、提前离场使用专属试炼结算，可再试，可从存档重看，不记轮回次数、遗泽或虚假坐化结局。
- 闭关预览、实际推进、文案及秘境期限提示共用时长。维持原本的分数月计算，按钮和文案按同一规则取整到月；没有改变普通局数值。
- 存档版本仍为 14，MX1 与存档键不变。

## 验证

- playtest 通过；regress_trial 通过（期限临界点、缺字段旧档、定型顺序与 30 组闭关减时组合）；regress_logs 通过；事件回归 29 项通过。
- audit_events：106993 次结算，0 违规。字体审计：缺字 0，子集重叠 0。
- sim.js 600 balanced：三灵根全体用时中位 82.8 分钟，敌我结算 55279 次，违规 0。
- 实际从卷首试炼入口创建角色，依次选阵基、衍寿纹和澄心纹，再通过页面按钮闭关：按钮与日志均为三年二月，实际推进 38.15424 月，与预览计算一致。
- 通过真实存档界面导入 v61 MX1 普通档，17 项状态一致；缺失道基／丹纹的旧试炼码也通过界面导入并补选，不消耗月数。
- 成功与超期分支使用隔离浏览器中的边界测试存档，再通过正常行动按钮触发；并非自然完整通玩，不替代任务 A4。成功、超期、再试及结果重看均通过；轮回次数和结局图鉴未增加。
- 28 张 JPEG，均小于 1 MB。主界面七尺寸昼夜及 440×956 DPR 3；成功结算四尺寸昼夜；另有失败、定型与说明笺。截图等待启动遮罩隐藏，关闭有限过渡动画后取景。无横向溢出，结算按钮可见，浏览器 pageerror 为 0。

[机器记录](checks.json)

## 截图

- [brief-day-440-dpr3.jpg](brief-day-440-dpr3.jpg)
- [hud-day-1280.jpg](hud-day-1280.jpg)
- [hud-day-1440.jpg](hud-day-1440.jpg)
- [hud-day-1920.jpg](hud-day-1920.jpg)
- [hud-day-360.jpg](hud-day-360.jpg)
- [hud-day-375.jpg](hud-day-375.jpg)
- [hud-day-390.jpg](hud-day-390.jpg)
- [hud-day-440-dpr3.jpg](hud-day-440-dpr3.jpg)
- [hud-day-440.jpg](hud-day-440.jpg)
- [hud-night-1280.jpg](hud-night-1280.jpg)
- [hud-night-1440.jpg](hud-night-1440.jpg)
- [hud-night-1920.jpg](hud-night-1920.jpg)
- [hud-night-360.jpg](hud-night-360.jpg)
- [hud-night-375.jpg](hud-night-375.jpg)
- [hud-night-390.jpg](hud-night-390.jpg)
- [hud-night-440-dpr3.jpg](hud-night-440-dpr3.jpg)
- [hud-night-440.jpg](hud-night-440.jpg)
- [path-day-390.jpg](path-day-390.jpg)
- [success-day-1440.jpg](success-day-1440.jpg)
- [success-day-1920.jpg](success-day-1920.jpg)
- [success-day-360.jpg](success-day-360.jpg)
- [success-day-390.jpg](success-day-390.jpg)
- [success-night-1440.jpg](success-night-1440.jpg)
- [success-night-1920.jpg](success-night-1920.jpg)
- [success-night-360.jpg](success-night-360.jpg)
- [success-night-390.jpg](success-night-390.jpg)
- [timeout-day-390.jpg](timeout-day-390.jpg)
- [timeout-night-1440.jpg](timeout-night-1440.jpg)
