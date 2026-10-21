# koishi-plugin-warframe

[![npm](https://img.shields.io/npm/v/koishi-plugin-warframe?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-warframe)

Toolkit for Warframe. Provides Warframe Market prices, fissures, arbitrations, relics, weekly missions, open world cycles, riven analysis, and more.

## Commands

### Warframe Market

| Command        | Arguments     | Aliases                                                   | Description                                                                            |
| -------------- | ------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `wmi`          | `<item-name:text>` |                                                           | Query Warframe Market item orders (medians, ducat values, etc.) Displayed as an image. |
| `wm`           | `<item-name:text>` |                                                           | **Deprecated**, use `wmi` instead.                                                     |
| `wmr`          | `<weapon> [stats...]` |                                                        | Query Warframe Market riven orders with optional attribute filters.                    |
| `wmu`          |               |                                                           | Update Warframe Market cache.                                                          |
| `pmod-history` |               | `pmodhistory`, `pmod`, `P卡`, `p卡`, `P卡历史`, `p卡历史` | Query Primed MOD price history.                                                        |
| `riven-hot`    |               | `hotriven`                                                | Query trending riven weapons ranking.                                                  |

`wmr` accepts space-separated attribute names after the weapon name. All specified
positive attributes must match; prefix a negative attribute with `负`. The negative
attribute can appear anywhere among the attributes, for example
`wmr 托里德 负变焦 暴击几率 暴击伤害` and
`wmr 托里德 暴击几率 负变焦 暴击伤害` are equivalent. Weapon names may contain
spaces, such as `wmr Kuva Bramma 暴击率`. Up to three distinct positive attributes
and one negative attribute are supported; omitted attributes are unrestricted.
Without attributes, the command retains its existing behavior.

Attribute names accept Chinese names, API slugs, and common aliases, including
`暴击几率` / `暴击率` / `暴击` / `爆击` / `爆击率` / `爆击几率` / `暴率` / `爆率`,
`暴击伤害` / `暴伤` / `爆伤` / `爆击伤害`, `变焦` / `变`, `弹匣容量` / `弹匣`,
`多重射击` / `多重`, `基础伤害` / `基伤`, `射速` / `攻速`, and
`弹速` / `投射` / `投射物` (projectile speed).
`后座`, `后坐`, `后坐力`, and `后座力` all mean weapon recoil and also accept
the `负` prefix, for example `wmr 托里德 暴击 爆伤 负后座`.
`异常伤害`, `异况伤害`, and `触发伤害` all mean status damage;
`触发` / `触发率` / `触发几率` mean status chance, `触时` means status duration,
and `范围` means attack range.
Aliases also work with the `负` prefix, for example `wmr 托里德 暴击 爆伤 负变`.
Faction damage aliases `C`, `G`, `I`, and `O` refer to Corpus, Grineer, Infested,
and Orokin respectively. They are case-insensitive and accept the `负` prefix,
for example `wmr 托里德 暴击 爆伤 负G` or `wmr 托里德 O 负c`.
Elemental aliases include `冰`, `火`, `毒`, `电`, `病毒`, `腐蚀`, `磁力`,
`辐射`, `爆炸`, and `毒气`. Separate multiple attributes with spaces.
Combined elements select their own market attributes, for example
`wmr 托里德 病毒 暴击 负投射`. The market catalog marks elemental damage
as positive-only, so negative elemental filters are rejected.

Additional shorthand (subject to the market catalog's positive/negative restrictions):

| Aliases | Attribute |
| --- | --- |
| `备弹` / `最大弹药` / `最大弹药值` | 弹药最大值 |
| `弹容` / `弹夹` / `弹夹容量` | 弹匣容量 |
| `弹效` | 弹药效率 |
| `冲` / `穿` / `切` | 冲击 / 穿刺 / 切割伤害 |
| `穿透深度` | 穿透 |
| `初连` / `初始连击` / `初始连击数` | 初始连击 |
| `滑暴` / `滑爆` / `滑行暴击` / `滑行爆击` | 滑行攻击暴击几率 |
| `连击时间` / `连击时长` / `连击持续` | 连击持续时间 |
| `额外连击` / `额外连击几率` | 额外连击数几率 |
| `负连击获取` / `负连击获取几率` | 连击获取几率（仅负词条） |
| `处决` | 处决伤害 |
| `重击效能` | 重击效率 |
| `重击蓄力速度` / `重击前摇速度` | 重击准备速度 |
| `重击伤害` | 在重击时的近战伤害 |
| `震地` / `震地伤害` | 震地攻击伤害 |
| `格挡` / `格挡角度` | 招架角度 |
| `收起装填` / `收纳装填` / `自动装填` | 收起武器时弹匣每秒自动装填 |
| `弱点暴击` / `弱点爆击` / `弱点暴率` / `弱点爆率` | 弱点暴击几率 |
| `弱点` | 弱点伤害 |
| `炽蛇` / `炽蛇军` | 对炽蛇军的伤害 |
| `科腐` / `科腐者` | 对科腐者的伤害 |

`C族` / `G族` / `I族` / `O族` are also accepted. Established names such as
`后坐力`, `基础伤害`, `近战伤害`, `弹药上限`, and `投射物飞行速度` remain accepted
when market translations change. Use precise names: `穿透` and `穿刺` are distinct,
as are initial combo, extra combo chance, and negative combo gain chance.

Unknown attributes, conflicting positive/negative attributes, and excessive
attribute counts produce an error instead of an unfiltered search.

`wm`, `wmi`, and `wmr` also support Chinese name fragments and homophones
(ignoring tones), with at least two Chinese characters. For example, `wmr 里德`
and `wmr 托里得` can resolve to `托里德`. Existing exact names, aliases and
shorthand take priority, followed by literal fragments, then homophones.
A unique match is queried directly; multiple matches show up to 10 candidate
names and ask you to complete the name. `wm` and `wmi` retain the `满级` option.
This does not add fuzzy English, typed pinyin, skipped-character or general typo
matching, and does not change `relic`.

### Fissures

| Command      | Arguments | Aliases                                 | Description                               |
| ------------ | --------- | --------------------------------------- | ----------------------------------------- |
| `fissure`    |           | `裂缝`, `裂隙`                          | List current void fissure missions.       |
| `fissure-sp` |           | `spfissure`, `钢铁裂缝`, `钢铁裂隙`     | List current steel path fissure missions. |
| `fissure-rj` |           | `rjfissure`, `九重天裂缝`, `九重天裂隙` | List current railjack fissure missions.   |

### Relics

| Command | Arguments          | Aliases        | Description                                                                  |
| ------- | ------------------ | -------------- | ---------------------------------------------------------------------------- |
| `relic` | `<relic-name:text>` | `遗物`, `核桃` | Query relic contents with drop chances, WFM median prices, and ducat values. |

### Weekly & Activities

| Command       | Arguments      | Aliases                                          | Description                                                                                        |
| ------------- | -------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `arbitration` | `[day:number]` | `arbi`, `仲裁`, `仲裁表`                         | Query high-value arbitration missions. Optional `day` controls how many days to show (default: 3). |
| `weekly`      |                | `周常`, `科研`, `时光科研`, `深层科研`, `执行官` | Query weekly missions (Archon Hunt, Deep Archimedea, Temporal Archimedea).                         |
| `circuit`     |                | `灵化之源`, `灵化`                               | Query weekly circuit rewards (warframes and incarnon adapters).                                    |
| `steel-essence` |                | `钢铁精华`                                     | Query this week's Steel Essence shop rotation (current offering, remaining time, upcoming).        |
| `1999calendar`  |                | `日历`, `1999日历`, `霍瓦尼亚日历`             | Query the current 1999 Höllvania calendar tagged days (challenges, overrides, rewards).            |
| `event`         |                | `活动`, `事件`                                 | Query active world events (progress, rewards, remaining time).                                    |

### Open World Cycles

| Command       | Arguments | Aliases                                                       | Description                                                              |
| ------------- | --------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `environment` |           | `env`, `平原`, `地球`, `金星`, `夜灵`, `夜灵平野`, `奥布山谷` | Query current open world cycles (Earth, Venus, Deimos, Duviri, Zariman). |

### Void Trader

| Command       | Arguments | Aliases                          | Description                                                             |
| ------------- | --------- | -------------------------------- | ----------------------------------------------------------------------- |
| `void-trader` |           | `voidtrader`, `虚空商人`, `奸商` | Query Baro Ki'Teer's current inventory and arrival/departure countdown. |

### Riven Mods

| Command        | Arguments                                                    | Aliases                         | Description                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `riven`        | `<img:image>`                                                |                                 | Analyze traditional and spliced riven stats from a screenshot using OCR. Kitguns require `-v primary` or `-v secondary`.                                                                                                                                                |
| `riven-weekly` | `[minPrice:number]`                                          | `weeklyriven`, `周紫卡`, `周卡` | Query weekly high-value riven reference (unrolled median prices).                                                                                                                               |
| `riven-stat`   | `<weaponType:string> <statType:string> <disposition:number>` | `rivenstat`, `紫卡数值`         | Query riven stat ranges by weapon type, stat type, and disposition.<br>Weapon types: 步枪(rifle), 手枪(pistol), 霰弹枪(shotgun), 近战(melee), Archwing枪械(archgun), Kitgun(组合枪), Zaw(组合近战)<br>Stat types: 2, 3, 21, 31 |

Riven calculations use a bundled official Public Export snapshot. See [data sources and refresh instructions](docs/riven-data.md).

### Kuva/Tenet/Coda (In Development)

The following commands are reserved but not yet implemented:

| Command  | Arguments | Aliases | Description                                    |
| -------- | --------- | ------- | ---------------------------------------------- |
| `lich-c` |           | `lichc` | Kuva weapons (hidden, in development)          |
| `lich-i` |           | `lichi` | Infested/Coda weapons (hidden, in development) |

## Install

Search `koishi-plugin-warframe` in Koishi dependency manager (not plugin market) and install.

It is recommended to set the npm registry to `https://registry.npmjs.com` before installing, because the dependency `warframe-public-export-plus` is unavailable on some mirrors.

## Changelog

Release notes for every version are published on the [GitHub Releases page](https://github.com/CloudeaSoft/koishi-plugin-warframe/releases).

## Develop

### Step 1: Setup koishi development environment

```bash
# Install package manager
npm i -g yarn

# Create koishi project
yarn create koishi
```

Follow the prompts and finalize the initialization process.

### Step 2: Clone repository

```bash
# Run the following in koishi root path
yarn clone CloudeaSoft/koishi-plugin-warframe
```

The plugin source code is created in `./external/warframe`.

### Step 3: Install dependencies

```bash
yarn install
```

### Step 4: Setup typescript version (optional)

This step disables the typescript warning in `tsconfig.json` caused by ^6.x typescript.

Open any `.ts` file in this project. Select the language bar Status Bar item (`{ }`), and then click `Select Version`. A message box will appear asking you which version of TypeScript VS Code should use, where you choose `Use Workspace Version` to use the correct version.

For more details, see [TypeScript documentation](https://code.visualstudio.com/docs/typescript/typescript-transpiling#_using-newer-typescript-versions).
