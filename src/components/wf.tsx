import { Element } from "koishi";
import { hexToRgb, lerp, msToHumanReadable, rgbToHex } from "../utils";

export const ArbitrationComponent = (arbi: Arbitration[]): Element => {
  return (
    <div
      style={
        "width:calc(100dvw-40px);display:flex;flex-direction:column;align-items: center;"
      }
    >
      <h1>高掉落仲裁时间表</h1>
      <div>
        <ul style={"width:100%;font-size: 30px;"}>
          {arbi.map((a) => {
            return (
              <li>
                <span>
                  [<span style={"color:darkgreen;"}>{a.time}</span>]
                </span>
                <span style={"margin-left:10px;"}>
                  {`${a.name} ${a.system}-${a.type} (${a.faction})`.replace(
                    /\(|\)/g,
                    ""
                  )}
                </span>
                <span style={"margin-left:10px;"}>
                  <span style={"color:darkgreen;"}>{a.rewards}</span>精华/h
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export const CircuitComponent = (
  incarnons: string[],
  warframes: string[]
): Element => {
  return (
    <div>
      <header style={"text-align: center;font-size:30px;"}>
        <h1>本周回廊奖励</h1>
      </header>
      <div
        style={
          "display:flex;flex-direction:column;align-items:center;margin-top:40px;font-size:40px;"
        }
      >
        <div style={"display:flex;align-items:center;line-height:1;"}>
          <span>灵化之源:</span>
          <ul style={"display:flex;gap:13px;margin-left:15px;"}>
            {incarnons.map((i) => {
              return <li>{i}</li>;
            })}
          </ul>
        </div>
        <div
          style={
            "display:flex;align-items:center;line-height:1;margin-top:40px;"
          }
        >
          <span>战甲:</span>
          <ul style={"display:flex;gap:13px;margin-left:15px;"}>
            {warframes.map((i) => {
              return <li>{i}</li>;
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const FissureComponent = (
  fissures: Fissure[],
  type: "fissure" | "sp-fissure" | "rj-fissure"
): Element => {
  const titles = {
    fissure: "虚空裂缝",
    "sp-fissure": "虚空裂缝 (钢铁之路)",
    "rj-fissure": "虚空裂缝 (九重天)",
  };
  const colors = [
    "#B87333",
    "#4A6F43",
    "#B2B2B2",
    "#D4AF37",
    "#8B0000",
    "#2F9E88",
  ];

  return (
    <div style="display:flex;flex-direction:column;align-items:center;">
      <h1 style={"font-size: 50px;"}>{titles[type]}</h1>
      <ul style={"font-size: 30px;margin-top:30px;"}>
        {fissures
          .filter((f) => f.expiry - Date.now() > 0)
          .map((f) => {
            let timeLeft = f.expiry - Date.now();
            return (
              <li style={"margin-top: 10px;"}>
                <span style={`color:${colors[f.tierNum - 1]};`}>
                  {`${f.tier}(T${f.tierNum})`}
                </span>
                <span style={"margin-left: 20px;"}>
                  {f.node.name} {f.node.system}
                </span>
                <span style={"margin-left: 10px;"}>{f.node.type}</span>
                <span style={"margin-left: 10px;color:purple;"}>
                  {f.node.faction}({f.node.minLevel + 5 + (f.hard ? 100 : 0)}-
                  {f.node.maxLevel + 5 + (f.hard ? 100 : 0)})
                </span>
                <span
                  style={`margin-left: 10px;color:${
                    timeLeft > 3600000
                      ? "green"
                      : timeLeft > 600000
                      ? "blue"
                      : "red"
                  };`}
                >
                  剩余{msToHumanReadable(timeLeft)}
                </span>
              </li>
            );
          })}
      </ul>
      <div style="margin-top: 30px; font-size: 30px;">
        注: 该功能的数据有一定延迟
      </div>
    </div>
  );
};

export const WeeklyComponent = async (
  archon: string,
  deepArchimedea: ArchiMedea,
  temporalArchimedea: ArchiMedea
) => {
  const archonRes = `执行官: ${archon}`;

  const deepRes = `${deepArchimedea.name}\n${deepArchimedea.missions
    .map((m) => {
      let result = `${m.type}\n偏差: ${m.diviation.name}(${m.diviation.desc})`;
      for (const risk of m.risks) {
        result += `\n风险: ${risk.name}(${risk.desc})`;
      }
      return result;
    })
    .join("\n")}\n${deepArchimedea.peronal
    .map((per) => {
      return `个人变量: ${per.name}(${per.desc})`;
    })
    .join("\n")}`;

  const tempRes = `${temporalArchimedea.name}\n${temporalArchimedea.missions
    .map((m) => {
      let result = `${m.type}\n偏差: ${m.diviation.name}(${m.diviation.desc})`;
      for (const risk of m.risks) {
        result += `\n风险: ${risk.name}(${risk.desc})`;
      }
      return result;
    })
    .join("\n")}\n${temporalArchimedea.peronal
    .map((per) => {
      return `个人变量: ${per.name}(${per.desc})`;
    })
    .join("\n")}`;
  return `${archonRes}\n\n${deepRes}\n\n${tempRes}`;
};

export const RelicComponent = (relic: OutputRelic): Element => {
  const gold = relic.items.filter((i) => i.rarity === "RARE");
  const silver = relic.items.filter((i) => i.rarity === "UNCOMMON");
  const bronze = relic.items.filter((i) => i.rarity === "COMMON");

  // 辅助函数：根据掉落率获取颜色
  const getRateColor = (rarity: RelicRewardRarity): string => {
    if (rarity === "RARE") return "#ffd700"; // 金色
    if (rarity === "UNCOMMON") return "#c0c0c0"; // 银色
    if (rarity === "COMMON") return "#cd7f32"; // 铜色
    return "#000000";
  };

  const relicRewardDropRate = {
    RARE: "2/4/6/10",
    UNCOMMON: "11/13/17/20",
    COMMON: "25/23/20/17",
  };

  const renderRewards = (items: OutputRelicReward[]) => {
    if (items.length === 0) return null;

    return items.map((item, index) => (
      <div
        style={`padding: 8px 12px;
          margin: 4px 0;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.05);
          border-left: 4px solid ${getRateColor(item.rarity)};
          display: flex;
          justify-content: space-between;
          align-items: center;
          line-height: 1;`}
      >
        <span style={`color: #000000; font-size: 14px;`}>{item.name}</span>
        <span
          style={`color: #a0a0a0;
              font-size: 12px;
              font-family: monospace;
              display:flex;
              gap:10px;`}
        >
          {item.platinum ? (
            <span
              style="
                color: #0d93b8;
                display:flex;
                line-height:1;"
            >
              {item.platinum}
              <svg
                viewBox="0 0 18 18"
                style="
                  color: rgb(64 64 64 / 75%);
                  height: 1em;
                  width: 1em;
                  vertical-align: -.125em;
                  fill: currentcolor;
                  margin-left:2px;"
              >
                <use href={`#icon-platinum`}></use>
              </svg>
            </span>
          ) : (
            ""
          )}
          {item.ducats ? (
            <span style="color: #a0a000;display:flex;line-height:1;">
              {item.ducats}
              <svg
                viewBox="0 0 18 18"
                style="
                color: rgb(64 64 64 / 75%);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
              >
                <use href={`#icon-ducats`}></use>
              </svg>
            </span>
          ) : (
            ""
          )}
          <span>{relicRewardDropRate[item.rarity]}%</span>
        </span>
      </div>
    ));
  };

  return (
    <div
      style={`
        border-radius: 8px;
        padding: 16px;
        margin: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        color: #000000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 500px;
        min-width: 320px;`}
    >
      {/* 遗物标题 */}
      <div
        style={`display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);`}
      >
        <h1
          style={`font-size: 20px;
            font-weight: bold;
            margin: 0;
            color: #000000;`}
        >
          {`${relic.tier} ${relic.num} 遗物`}
        </h1>
      </div>

      {/* 金奖励 */}
      {gold.length > 0 && (
        <div style={`margin-bottom: 12px;`}>
          <div
            style={`display: flex;
              align-items: center;
              margin-bottom: 8px;`}
          >
            <h3
              style={`font-size: 14px;
                font-weight: bold;
                color: #ffd700;
                margin: 0;
                text-transform: uppercase;`}
            >
              稀有
            </h3>
          </div>
          {renderRewards(gold)}
        </div>
      )}

      {/* 银奖励 */}
      {silver.length > 0 && (
        <div style={`margin-bottom: 12px;`}>
          <div
            style={`display: flex;
              align-items: center;
              margin-bottom: 8px;`}
          >
            <h3
              style={`font-size: 14px;
                font-weight: bold;
                color: #c0c0c0;
                margin: 0;
                text-transform: uppercase;`}
            >
              罕见
            </h3>
          </div>
          {renderRewards(silver)}
        </div>
      )}

      {/* 铜奖励 */}
      {bronze.length > 0 && (
        <div style={`margin-bottom: 12px;`}>
          <div
            style={`display: flex;
              align-items: center;
              margin-bottom: 8px;`}
          >
            <h3
              style={`font-size: 14px;
                font-weight: bold;
                color: #cd7f32;
                margin: 0;
                text-transform: uppercase;`}
            >
              常见
            </h3>
          </div>
          {renderRewards(bronze)}
        </div>
      )}

      {/* 备注信息 */}
      <div
        style={`margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 10px;
          color: #888888;
          text-align: center;`}
      >
        价格数据来源于 WFM Ducanator, 约有1小时延迟
      </div>
    </div>
  );
};

export const RivenComponent = (data: RivenStatAnalyzeResult): Element => {
  // 格式化数值显示
  const formatValue = (value: number, unit: RivenAttributeUnit): string => {
    switch (unit) {
      case "percent":
        return `${value.toFixed(1)}%`;
      case "multiply":
        return `x${value.toFixed(2)}`;
      case "seconds":
        return `${value.toFixed(2)}s`;
      default:
        return value.toString();
    }
  };

  // 格式化范围显示
  const formatRange = (
    min: number,
    max: number,
    unit: RivenAttributeUnit
  ): string => {
    const format = (num: number) => {
      switch (unit) {
        case "percent":
          return `${num.toFixed(1)}%`;
        case "multiply":
          return `x${num.toFixed(2)}`;
        case "seconds":
          return `${num.toFixed(2)}s`;
        default:
          return num.toString();
      }
    };
    return `${format(min)} - ${format(max)}`;
  };

  const isInRange = (percent: number): boolean => {
    return percent <= 0.1 && percent >= -0.1;
  };

  const getPercentColor = (percent: number) => {
    const clampedPercent = Math.max(-0.1, Math.min(0.1, percent));
    const normalized = (clampedPercent + 0.1) / 0.2;
    const colors = [
      { pos: 0.0, color: "#fa4336" },
      { pos: 0.25, color: "#ff9800" },
      { pos: 0.5, color: "#ff9800" },
      { pos: 0.75, color: "#8bc34a" },
      { pos: 1.0, color: "#4caf50" },
    ];

    let startColor = colors[0];
    let endColor = colors[colors.length - 1];
    for (let i = 0; i < colors.length - 1; i++) {
      if (normalized >= colors[i].pos && normalized <= colors[i + 1].pos) {
        startColor = colors[i];
        endColor = colors[i + 1];
        break;
      }
    }

    const range = endColor.pos - startColor.pos;
    const relativePosition =
      range > 0 ? (normalized - startColor.pos) / range : 0;

    const startRgb = hexToRgb(startColor.color);
    const endRgb = hexToRgb(endColor.color);

    const r = lerp(startRgb.r, endRgb.r, relativePosition);
    const g = lerp(startRgb.g, endRgb.g, relativePosition);
    const b = lerp(startRgb.b, endRgb.b, relativePosition);

    return rgbToHex(r, g, b);
  };

  const getDispositionIcon = (disposition: number) => {
    if (disposition < 0.5) {
      return "◯◯◯◯◯";
    } else if (disposition < 0.69) {
      return "⬤◯◯◯◯";
    } else if (disposition <= 0.89) {
      return "⬤⬤◯◯◯";
    } else if (disposition <= 1.1) {
      return "⬤⬤⬤◯◯";
    } else if (disposition <= 1.3) {
      return "⬤⬤⬤⬤◯";
    } else {
      return "⬤⬤⬤⬤⬤";
    }
  };

  const getProgressWidth = (percent: number): string => {
    const normalized = ((percent + 1) / 2) * 100;
    return `${Math.max(0, Math.min(100, normalized))}%`;
  };

  return (
    <div style={`display: flex; gap: 20px; width: 600px;`}>
      <div
        style={`width: 100%; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #444;`}
      >
        {/* 武器名称和倾向 */}
        <div
          style={`display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #444;`}
        >
          <h2 style={`margin: 0; font-size: 20px;`}>{data.name}</h2>
          <div
            style={`background-color: #f0f0f0; padding: 4px 12px; border-radius: 12px; font-size: 14px; line-height: 1;`}
          >
            {`倾向: ${getDispositionIcon(
              data.disposition
            )} (${data.disposition.toFixed(2)})`}
          </div>
        </div>

        {/* 正面词条 */}
        <div style={`margin-bottom: 25px;`}>
          <h3
            style={`color: #4caf50; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;`}
          >
            正面词条 ({data.buffs.length})
          </h3>

          <ul>
            {data.buffs.map((buff) => {
              const inRange = isInRange(buff.percent);
              const percentColor = getPercentColor(buff.percent);

              return (
                <li
                  style={`
                    background-color: #eeeeee;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 10px;
                    border-left: 4px solid ${percentColor};
                    position: relative;`}
                >
                  <div
                    style={`display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;`}
                  >
                    <span style={`font-weight: bold;`}>{buff.name}</span>
                    <span style={`font-size: 18px; font-weight: bold;`}>
                      {formatValue(buff.value, buff.unit)}
                    </span>
                  </div>

                  {/* 进度条 */}
                  <div
                    style={`height: 10px; background-color: #444; border-radius: 3px; margin-bottom: 8px;`}
                  >
                    <div
                      style={`height: 10px; position: relative; overflow: hidden;`}
                    >
                      <p
                        style={`position: absolute; left: 0; top: 0; height: 100%; width: ${getProgressWidth(
                          buff.percent * 10
                        )}; background-color: ${percentColor}; border-radius: 3px;`}
                      ></p>
                    </div>
                  </div>

                  <div
                    style={`display: flex; justify-content: space-between; font-size: 12px; color: #aaa;`}
                  >
                    <span>
                      范围: {formatRange(buff.min, buff.max, buff.unit)}
                    </span>
                    <span style={`color: ${percentColor};`}>
                      {buff.percent > 0 ? "+" : ""}
                      {(buff.percent * 100).toFixed(2) + "%"}
                    </span>
                  </div>

                  {/* 范围警告 */}
                  {!inRange ? (
                    <div
                      style={`margin-top: 8px; padding: 6px; background-color: rgba(244, 67, 54, 0.2); border-radius: 4px; font-size: 12px; color: #f44336; display: flex; align-items: center;`}
                    >
                      <span style={`margin-right: 6px;`}>⚠</span>
                      数值不在正常范围内（可能未满级或倾向未更新）
                    </div>
                  ) : (
                    ""
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* 负面词条 */}
        {data.curses.length > 0 ? (
          <div>
            <h3
              style={`color: #f44336; margin: 0 0 15px 0; font-size: 16px; display: flex; align-items: center;`}
            >
              负面词条 ({data.curses.length})
            </h3>

            <ul>
              {data.curses.map((curse, curseIndex) => {
                const inRange = isInRange(curse.percent);
                const percentColor = getPercentColor(curse.percent);
                return (
                  <li
                    style={`background-color: #eeeeee; border-radius: 6px; padding: 12px; margin-bottom: 10px; border-left: 4px solid ${percentColor};`}
                  >
                    <div
                      style={`display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;`}
                    >
                      <span style={`font-weight: bold;`}>{curse.name}</span>
                      <span style={`font-size: 18px; font-weight: bold;`}>
                        {formatValue(curse.value, curse.unit)}
                      </span>
                    </div>

                    {/* 进度条 */}
                    <div
                      style={`height: 10px; background-color: #444; border-radius: 3px; margin-bottom: 8px;`}
                    >
                      <div
                        style={`height: 10px; position: relative; overflow: hidden;`}
                      >
                        <p
                          style={`position: absolute; left: 0; top: 0; height: 100%; width: ${getProgressWidth(
                            curse.percent * 10
                          )}; background-color: ${percentColor}; border-radius: 3px;`}
                        ></p>
                      </div>
                    </div>

                    <div
                      style={`display: flex; justify-content: space-between; font-size: 12px; color: #aaa;`}
                    >
                      <span>
                        范围: {formatRange(curse.min, curse.max, curse.unit)}
                      </span>
                      <span style={`color: ${percentColor};`}>
                        {curse.percent > 0 ? "+" : ""}
                        {(curse.percent * 100).toFixed(2) + "%"}
                      </span>
                    </div>

                    {/* 范围警告 */}
                    {!inRange ? (
                      <div
                        style={`margin-top: 8px; padding: 6px; background-color: rgba(244, 67, 54, 0.2); border-radius: 4px; font-size: 12px; color: #f44336; display: flex; align-items: center;`}
                      >
                        <span style={`margin-right: 6px;`}>⚠</span>
                        数值不在正常范围内（可能未满级或倾向未更新）
                      </div>
                    ) : (
                      ""
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export const VoidTraderComponent = (data: VoidTrader): Element => {
  return (
    <div
      style={`width: 400px; padding: 10px; font-family: sans-serif; font-size: 14px;`}
    >
      <table style={`width: 100%; border-collapse: collapse;`}>
        <thead>
          <tr>
            <th
              style={`border-bottom: 1px solid #ccc; text-align: left; padding: 6px;`}
            >
              名称
            </th>
            <th
              style={`border-bottom: 1px solid #ccc; text-align: left; padding: 6px;`}
            >
              价格
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr>
              <td style={`padding: 6px; border-bottom: 1px solid #eee;`}>
                {item.name}
              </td>
              <td
                style={`padding: 6px; border-bottom: 1px solid #eee; text-align: center;line-height: 1;`}
              >
                <span>{item.ducats}</span>
                <svg
                  viewBox="0 0 18 18"
                  style="
                color: rgb(64 64 64 / 75%);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
                >
                  <use href={`#icon-ducats`}></use>
                </svg>
                <span>+</span>
                <span>{item.credits}</span>
                <span>现金</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
