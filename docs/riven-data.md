# 紫卡计算数据

`riven` 截图分析和 `riven-stat`（别名 `rivenstat`、`紫卡数值`）共用
`src/warframe/assets/riven-public-export.json`。这是随插件版本发布的官方
Public Export 快照，查询时不联网，也不依赖 Warframe Market 的词条接口。
不再维护 `rivenAttrValues.json` 或 `rivencalc.json` 数值表。

## 更新快照

同步脚本使用 Node.js，`lzma` 仅作为开发依赖解压官方索引。运行插件不需要该依赖。
从包目录执行：

```sh
yarn riven:update
yarn riven:test-sync
yarn build
yarn dtsc
yarn lint
yarn test
```

更新脚本从 `https://content.warframe.com/PublicExport/` 下载中英文
`index_*.txt.lzma`，解压后读取索引指定版本的 `ExportUpgrades` 和
`ExportWeapons`。快照记录下载时间、每个源 URL、SHA256 和字节数。
只保留紫卡定义、武器名称和倾向等计算相关字段，原始浮点数和所有
`upgradeValues` 均保留。所有下载和验证成功后原子替换快照；失败不覆盖旧文件。
检查快照差异和验证结果后，将快照随代码提交发布。普通构建不会自动刷新数据。

数值来源：官方 `upgradeEntries[].upgradeValues[].value`；倾向来源：官方
`omegaAttenuation`。组合枪主武器使用 `primeOmegaAttenuation`，副武器使用
`omegaAttenuation`，截图分析使用 `riven -v primary` 或 `riven -v secondary`
指定形态，不对缺失的主副武器信息作猜测。

官方精简导出没有武器与紫卡类别的完整兼容关系，也没有传统词条正负资格。
这两项元数据继续由现有 `warframe-public-export-plus` 适配提供，其数值不参与计算。
明确可判断的武器大类可回退到官方 `productCategory`；无法判断的武器不猜测类别。
中文导出当前仍返回英文紫卡显示模板，所以适配器保留中文名称映射；武器中文名
使用官方中文导出。新增属性需确认单位和资格后再开放计算，不会仅凭导出中出现
一个新字段就猜测其用途。

## 计算及限制

所有范围按满级 Rank 8 计算：原始值乘 `10 × 9`，百分比再乘 `100`，
反转标记调整显示符号，再乘具体武器倾向和布局系数。支持 `2`、`3`、`21`、`31`
四种布局和 Rifle、Shotgun、Pistol、Archgun、Melee、Kitgun、Zaw 七类。
多 value 传统词条使用首个正常攻击值；其余条件值保留在原始快照中，不混作独立词条。

融合属性标记为“融合”，只列入正面范围。派系属性显示 `1 + bonus` 倍率；
弹药效率使用官方 `reverseValueSymbol`，不会把原始负号误认成负面属性。
OCR 按完整名称优先匹配，随后依据每条效果的方向区分正负布局；无法识别的
数值行会使分析失败，避免丢掉一条属性后错误评分。

2026-10-09 快照包含 18 种融合属性、97 条类别与属性记录。格挡角度有原始值，
但显示换算仍待确认，所以只提示、不计算；Archgun 收枪装填缺少官方值，不补零、
不借用其他类别。融合范围沿用现有社区范围模型，并在输出中标为参考；官方导出
没有提供融合数值继承算法，不能将评分解释为已验证的客户端随机品级。

规则依据：[44.1.0 官方更新说明](https://www.warframe.com/en/patch-notes/pc/44-1-0)。
初始英文导出 SHA256 为
`20d3da857b4b5bd6770464eb1acd772b7f21a079ea19bd61c0db2aa61f47e012`；
后续版本以快照内的来源记录为准。
