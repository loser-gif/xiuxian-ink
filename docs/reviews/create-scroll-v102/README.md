# v102 · 灵石留白

2026-10-27。仅用两条限定于拜山页的 CSS 隐藏滚动轨道，保留 overflow-y:auto 和原有布局。参考开源讨论 https://github.com/tailwindlabs/tailwindcss/discussions/4741 ，无新增依赖。

桌面 1440×800、手机 440×956 昼夜和 320×568 实测：两种滚动条样式均隐藏，滚轮可到达结果末尾，拜山按钮可见，无横向溢出和页面错误。320 小屏实测 End 键与触屏上滑均可滚至底部。字体审计与 regress_soft 通过，SAVE_V 仍为16。Windows Edge 与手机视口模拟，未测 iPhone 真机。

![桌面结果末尾](result-1440-day.jpg)

![手机](result-440-day.jpg)

![夜墨](result-440-night.jpg)
