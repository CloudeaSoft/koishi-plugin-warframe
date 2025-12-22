import { Element } from "koishi";
import { msToHumanReadable } from "../utils";

export const ArbitrationTable = (arbi: Arbitration[]): Element => {
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

export const CircuitTable = (
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

export const FissureTable = (
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

export const WeeklyTable = async (
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
