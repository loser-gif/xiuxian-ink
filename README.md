# 墨仙录 · 水墨修仙文字游戏

一卷水墨，半世长生。纯文字修仙小游戏，静态网页，适配 iPhone Safari。

- 纯静态：`index.html` + `css/` + `js/` + `fonts/`，无需构建
- 字体：霞鹜文楷、马善政楷书、志莽行书（均为 OFL 开源字体，已自托管子集）
- 存档：浏览器 localStorage

## v0.2
- 修复：iOS Safari 竖排副标题字形被裁半。原因是 `writing-mode: vertical-rl` 的文字放进带 transform/opacity 动画的合成层后，WebKit 用竖排“翻转块”坐标算字形墨迹溢出，层边界算错，每个字左侧被裁掉。现在所有竖排文字都改成逐字纵向堆叠（`.vt/.vcol`），不再依赖 writing-mode；字体子集也去掉了 vhea/vmtx。
- `tools/fonts.py audit|build`：抽取 html/js/css 中的全部字符，逐个检查每个字体子集的 cmap 和字形，并核对 css 里的 unicode-range 与字体文件一致。
- 动效：开卷落墨、逐字运笔、印章按压；陀螺仪/触摸视差；四季飘落；墨染转场；吐纳聚气、闭关洞府渐暗、游历山路；境界天色与金色光晕；香火呼吸；按钮按压；破境光芒与金屑。遵循 prefers-reduced-motion。
