# koishi-plugin-warframe

[![npm](https://img.shields.io/npm/v/koishi-plugin-warframe?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-warframe)

Toolkit for Warframe. Provides Warframe Market prices, fissures, arbitrations, relics, weekly missions, open world cycles, riven analysis, and more.

## Commands

### Warframe Market

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `wmi` | `<item:text>` | | Query Warframe Market item orders (medians, ducat values, etc.) Displayed as an image. |
| `wm` | `<item:text>` | | **Deprecated**, use `wmi` instead. |
| `wmr` | `<item:text>` | | Query Warframe Market riven orders. |
| `wmu` | | | Update Warframe Market cache. |
| `pmodhistory` | | `pmod`, `P卡`, `p卡`, `P卡历史`, `p卡历史` | Query Primed MOD price history. |
| `hotriven` | | | Query trending riven weapons ranking. |

### Fissures

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `fissure` | | `裂缝`, `裂隙` | List current void fissure missions. |
| `spfissure` | | `钢铁裂缝`, `钢铁裂隙` | List current steel path fissure missions. |
| `rjfissure` | | `九重天裂缝`, `九重天裂隙` | List current railjack fissure missions. |

### Relics

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `relic` | `<relic:text>` | `遗物`, `核桃` | Query relic contents with drop chances, WFM median prices, and ducat values. |

### Weekly & Activities

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `arbitration` | `[day:number]` | `arbi`, `仲裁`, `仲裁表` | Query high-value arbitration missions. Optional `day` controls how many days to show (default: 3). |
| `weekly` | | `周常`, `科研`, `时光科研`, `深层科研`, `执行官` | Query weekly missions (Archon Hunt, Deep Archimedea, Temporal Archimedea). |
| `circuit` | | `灵化之源`, `灵化` | Query weekly circuit rewards (warframes and incarnon adapters). |

### Open World Cycles

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `environment` | | `env`, `平原`, `地球`, `金星`, `夜灵`, `夜灵平野`, `奥布山谷` | Query current open world cycles (Earth, Venus, Deimos, Duviri, Zariman). |

### Void Trader

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `voidtrader` | | `虚空商人`, `奸商` | Query Baro Ki'Teer's current inventory and arrival/departure countdown. |

### Riven Mods

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `riven` | `<img:image>` | | Analyze riven stats from a screenshot using OCR. |
| `rivenstat` | `<weaponType:string> <statType:string> <disposition:number>` | `紫卡数值` | Query riven stat ranges by weapon type, stat type, and disposition.<br>Weapon types: 步枪(rifle), 手枪(pistol), 霰弹枪(shotgun), 近战(melee), Archwing枪械(archgun)<br>Stat types: 2, 3, 21, 31 |

### Kuva/Tenet/Coda (In Development)

The following commands are reserved but not yet implemented:

| Command | Arguments | Aliases | Description |
| ------- | --------- | ------- | ----------- |
| `lichc` | | | Kuva weapons (hidden, in development) |
| `lichi` | | | Infested/Coda weapons (hidden, in development) |

## Install

Search `koishi-plugin-warframe` in Koishi dependency manager (not plugin market) and install.

It is recommended to set the npm registry to `https://registry.npmjs.com` before installing, because the dependency `warframe-public-export-plus` is unavailable on some mirrors.