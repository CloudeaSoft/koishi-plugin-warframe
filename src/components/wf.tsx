import { Element } from "koishi";
import { hexToRgb, lerp, msToHumanReadable, rgbToHex } from "../utils";
import { RivenAttributeUnit } from "../types/wfm/riven";
import { RivenStatAnalyzeResult, RivenStatResult } from "../types/wf/riven";

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
                    "",
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
  currentIncarnons: number,
  currentWarframes: number,
  allIncarnons: string[][],
  allWarframes: string[][],
): Element => {
  return (
    <div
      style={`
      background: linear-gradient(135deg, #f5f0e8 0%, #fff8f0 100%);
      min-height: 100vh;
      padding: 40px 24px;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    `}
    >
      <div
        style={`
        max-width: 1280px;
        margin: 0 auto;
      `}
      >
        <header
          style={`
          text-align: center;
          margin-bottom: 48px;
        `}
        >
          <h1
            style={`
            font-size: 3rem;
            font-weight: 800;
            background: linear-gradient(135deg, #ff8c42, #ff3c00);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            margin: 0;
            letter-spacing: -1px;
          `}
          >
            🌀 回廊奖励总览
          </h1>
          <p
            style={`
            color: #8b7355;
            font-size: 1.1rem;
            margin-top: 12px;
            opacity: 0.8;
          `}
          >
            共 {Math.max(allIncarnons.length, allWarframes.length)} 周 ·
            当前灵化周第 {currentIncarnons + 1} 周 · 当前战甲周第{" "}
            {currentWarframes + 1} 周
          </p>
        </header>

        <div
          style={`
          display: flex;
          flex-direction: column;
          gap: 24px;
        `}
        >
          {/* 灵化之源 - 按 allIncarnons 循环 */}
          <div
            style={`
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border-radius: 28px;
            padding: 24px 28px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.05);
          `}
          >
            <div
              style={`
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 1px solid #e8ddd0;
            `}
            >
              <span
                style={`
                font-size: 1.8rem;
                font-weight: 700;
                color: #c97e3a;
              `}
              >
                🔮 灵化之源
              </span>
              <span
                style={`
                background: #ffedd5;
                color: #c97e3a;
                padding: 4px 12px;
                border-radius: 40px;
                font-size: 0.85rem;
                font-weight: 600;
              `}
              >
                共 {allIncarnons.length} 周
              </span>
            </div>

            <div
              style={`
              display: flex;
              flex-direction: column;
              gap: 20px;
            `}
            >
              {allIncarnons.map((incarnons, weekIdx) => {
                const isCurrentWeek = weekIdx === currentIncarnons;

                return (
                  <div
                    style={`
                      background: ${
                        isCurrentWeek
                          ? "linear-gradient(135deg, #fff8e7, #fff2e0)"
                          : "rgba(250, 245, 238, 0.8)"
                      };
                      border-radius: 20px;
                      padding: 16px 20px;
                      box-shadow: ${
                        isCurrentWeek
                          ? "0 8px 20px rgba(255, 107, 53, 0.15), 0 0 0 2px #ff8c42 inset"
                          : "0 2px 6px rgba(0, 0, 0, 0.02)"
                      };
                      transition: all 0.2s ease;
                      transform: ${isCurrentWeek ? "scale(1.01)" : "scale(1)"};
                    `}
                  >
                    <div
                      style={`
                      display: flex;
                      align-items: center;
                      gap: 10px;
                      margin-bottom: 12px;
                    `}
                    >
                      <span
                        style={`
                        font-weight: 700;
                        font-size: 1.2rem;
                        color: ${isCurrentWeek ? "#ff6b3d" : "#b87c4f"};
                      `}
                      >
                        第 {weekIdx + 1} 周
                      </span>
                      {isCurrentWeek ? (
                        <span
                          style={`
                          background: #ff6b3d;
                          color: white;
                          padding: 2px 10px;
                          border-radius: 40px;
                          font-size: 0.7rem;
                          font-weight: 600;
                        `}
                        >
                          🔥 当前周
                        </span>
                      ) : null}
                    </div>

                    <ul
                      style={`
                      display: flex;
                      flex-wrap: wrap;
                      gap: 10px;
                      margin: 0;
                      padding: 0;
                      list-style: none;
                    `}
                    >
                      {incarnons.map((item) => (
                        <li
                          style={`
                          background: ${isCurrentWeek ? "#fff0e0" : "#faf5ee"};
                          padding: 6px 18px;
                          border-radius: 40px;
                          font-size: 0.95rem;
                          font-weight: 500;
                          color: #b45a2a;
                          border: ${isCurrentWeek ? "1px solid #ffd7a5" : "1px solid #f0e2d4"};
                        `}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 战甲 - 按 allWarframes 循环 */}
          <div
            style={`
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(8px);
            border-radius: 28px;
            padding: 24px 28px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.05);
          `}
          >
            <div
              style={`
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
              padding-bottom: 12px;
              border-bottom: 1px solid #e8ddd0;
            `}
            >
              <span
                style={`
                font-size: 1.8rem;
                font-weight: 700;
                color: #3d8b7a;
              `}
              >
                🛡️ 战甲
              </span>
              <span
                style={`
                background: #d1fae5;
                color: #3d8b7a;
                padding: 4px 12px;
                border-radius: 40px;
                font-size: 0.85rem;
                font-weight: 600;
              `}
              >
                共 {allWarframes.length} 周
              </span>
            </div>

            <div
              style={`
              display: flex;
              flex-direction: column;
              gap: 20px;
            `}
            >
              {allWarframes.map((warframes, weekIdx) => {
                const isCurrentWeek = weekIdx === currentWarframes;

                return (
                  <div
                    style={`
                      background: ${
                        isCurrentWeek
                          ? "linear-gradient(135deg, #e6f9f5, #dcf3ef)"
                          : "rgba(240, 248, 246, 0.8)"
                      };
                      border-radius: 20px;
                      padding: 16px 20px;
                      box-shadow: ${
                        isCurrentWeek
                          ? "0 8px 20px rgba(71, 181, 165, 0.15), 0 0 0 2px #47b5a5 inset"
                          : "0 2px 6px rgba(0, 0, 0, 0.02)"
                      };
                      transition: all 0.2s ease;
                      transform: ${isCurrentWeek ? "scale(1.01)" : "scale(1)"};
                    `}
                  >
                    <div
                      style={`
                      display: flex;
                      align-items: center;
                      gap: 10px;
                      margin-bottom: 12px;
                    `}
                    >
                      <span
                        style={`
                        font-weight: 700;
                        font-size: 1.2rem;
                        color: ${isCurrentWeek ? "#2e8b7a" : "#5f9e8e"};
                      `}
                      >
                        第 {weekIdx + 1} 周
                      </span>
                      {isCurrentWeek ? (
                        <span
                          style={`
                          background: #47b5a5;
                          color: white;
                          padding: 2px 10px;
                          border-radius: 40px;
                          font-size: 0.7rem;
                          font-weight: 600;
                        `}
                        >
                          🔥 当前周
                        </span>
                      ) : null}
                    </div>

                    <ul
                      style={`
                      display: flex;
                      flex-wrap: wrap;
                      gap: 10px;
                      margin: 0;
                      padding: 0;
                      list-style: none;
                    `}
                    >
                      {warframes.map((item) => (
                        <li
                          style={`
                          background: ${isCurrentWeek ? "#e0f7f2" : "#f0f8f6"};
                          padding: 6px 18px;
                          border-radius: 40px;
                          font-size: 0.95rem;
                          font-weight: 500;
                          color: #2c6b5e;
                          border: ${isCurrentWeek ? "1px solid #9ed9ce" : "1px solid #dcece8"};
                        `}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部装饰 */}
        <div
          style={`
          margin-top: 40px;
          text-align: center;
          font-size: 0.85rem;
          color: #c0a080;
          border-top: 1px solid #f0e2d4;
          padding-top: 24px;
        `}
        >
          ✨ 每周一更新 ✨
        </div>
      </div>
    </div>
  );
};

export const FissureComponent = (
  fissures: Fissure[],
  type: "fissure" | "sp-fissure" | "rj-fissure",
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

export const WeeklyComponent = (
  archon: ArchonHunt,
  deepArchimedea: ArchiMedea,
  temporalArchimedea: ArchiMedea,
): Element => {
  const archonHuntSection = (
    <section
      style={`
            border-radius: 8px;
            border: 1px solid #1f2937;
            padding: 12px 14px;
            background-color: #0b0f19;
            box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.9);
            color: #e5e7eb;
          `}
    >
      <div
        style={`
              font-size: 12px;
              color: #9ca3af;
              margin-bottom: 6px;
            `}
      >
        {"Archon Hunt"}
      </div>

      <div
        style={`
              font-size: 16px;
              font-weight: 600;
            `}
      >
        {`执行官刺杀: ${archon.name}`}
      </div>
    </section>
  );

  const deepArchimedeaSection = (
    <section
      style={`
            border-radius: 8px;
            border: 1px solid #1f2937;
            padding: 12px 14px;
            background-color: #0b0f19;
            box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.9);
            color: #e5e7eb;
          `}
    >
      <div
        style={`
              font-size: 12px;
              color: #6ee7b7;
              margin-bottom: 6px;
            `}
      >
        {"Deep Archimedea"}
      </div>

      <div
        style={`
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
            `}
      >
        {deepArchimedea.name}
      </div>

      {deepArchimedea.missions.map((m) => (
        <div
          style={`
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.15);
                padding: 8px 10px;
                margin-bottom: 8px;
                background-color: rgba(255,255,255,0.05);
              `}
        >
          <div
            style={`
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 4px;
                `}
          >
            {m.type}
          </div>

          <div style={`font-size: 12px;`}>
            <div>
              <span style={`font-weight: 600; margin-right: 4px;`}>
                {"偏差:"}
              </span>
              {`${m.deviation.name}(${m.deviation.desc})`}
            </div>

            {m.risks.map((r) => (
              <div>
                <span style={`font-weight: 600; margin-right: 4px;`}>
                  {"风险:"}
                </span>
                {`${r.name}(${r.desc})`}
              </div>
            ))}
          </div>
        </div>
      ))}

      {deepArchimedea.peronal.map((p) => (
        <div style={`font-size: 12px; margin-top: 4px;`}>
          <span style={`font-weight: 600; margin-right: 4px;`}>
            {"个人变量:"}
          </span>
          {`${p.name}(${p.desc})`}
        </div>
      ))}
    </section>
  );

  const temporalArchimedeaSection = (
    <section
      style={`
            border-radius: 8px;
            border: 1px solid #1f2937;
            padding: 12px 14px;
            background-color: #0b0f19;
            box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.9);
            color: #e5e7eb;
          `}
    >
      <div
        style={`
              font-size: 12px;
              color: #a5b4fc;
              margin-bottom: 6px;
            `}
      >
        {"Temporal Archimedea"}
      </div>

      <div
        style={`
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 8px;
            `}
      >
        {temporalArchimedea.name}
      </div>

      {temporalArchimedea.missions.map((m) => (
        <div
          style={`
                border-radius: 6px;
                border: 1px solid rgba(255,255,255,0.15);
                padding: 8px 10px;
                margin-bottom: 8px;
                background-color: rgba(255,255,255,0.05);
              `}
        >
          <div
            style={`
                  font-size: 13px;
                  font-weight: 600;
                  margin-bottom: 4px;
                `}
          >
            {m.type}
          </div>

          <div style={`font-size: 12px;`}>
            <div>
              <span style={`font-weight: 600; margin-right: 4px;`}>
                {"偏差:"}
              </span>
              {`${m.deviation.name}(${m.deviation.desc})`}
            </div>

            {m.risks.map((r) => (
              <div>
                <span style={`font-weight: 600; margin-right: 4px;`}>
                  {"风险:"}
                </span>
                {`${r.name}(${r.desc})`}
              </div>
            ))}
          </div>
        </div>
      ))}

      {temporalArchimedea.peronal.map((p) => (
        <div style={`font-size: 12px; margin-top: 4px;`}>
          <span style={`font-weight: 600; margin-right: 4px;`}>
            {"个人变量:"}
          </span>
          {`${p.name}(${p.desc})`}
        </div>
      ))}
    </section>
  );

  return (
    <div
      style={`
          color: #e4e7ec;
          line-height: 1.5;
          font-size: 14px;
          background-color: #05060a;
          font-family: 'Segoe UI', system-ui, sans-serif;
          max-width: 1024px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        `}
    >
      {archonHuntSection}
      {deepArchimedeaSection}
      {temporalArchimedeaSection}
    </div>
  );
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
    unit: RivenAttributeUnit,
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
              data.disposition,
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
                          buff.percent * 10,
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
                            curse.percent * 10,
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

export const RivenStatComponent = (data: RivenStatResult): Element => {
  const getValue = (value: number, unit: RivenAttributeUnit) => {
    switch (unit) {
      case "multiply":
        return "x" + (1 + value).toFixed(2);
      case "seconds":
        return value.toFixed(2) + "s";
      case "percent":
        return value.toFixed(2) + "%";
      default:
        return value.toFixed(2);
    }
  };
  return (
    <div
      style={`
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        font-family: system-ui, sans-serif;
        background-color: #1a1a2e;
        border-radius: 8px;
        max-width: 600px;
      `}
    >
      <div
        style={`
        display: flex;
        gap: 16px;
      `}
      >
        {/* 正面属性列 */}
        <div
          style={`
          flex: 1;
        `}
        >
          <div
            style={`
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              padding: 0 4px;
            `}
          >
            <h3
              style={`
              margin: 0;
              color: #7dd56f;
              font-size: 16px;
              font-weight: 600;
            `}
            >
              正面属性
            </h3>
            <div
              style={`
              display: flex;
              gap: 12px;
            `}
            >
              <span
                style={`
                color: #888;
                font-size: 12px;
              `}
              >
                最小
              </span>
              <span
                style={`
                color: #888;
                font-size: 12px;
              `}
              >
                最大
              </span>
            </div>
          </div>
          <div
            style={`
              display: flex;
              flex-direction: column;
              gap: 4px;
            `}
          >
            {Object.entries(data.positive).map(([_, value]) => (
              <div
                style={`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background-color: #16213e;
      border-radius: 4px;
      border-left: 3px solid #7dd56f;
    `}
              >
                <span
                  style={`
      color: #e0e0e0;
      font-size: 13px;
    `}
                >
                  {value.name}
                </span>
                <div
                  style={`
      display: flex;
      gap: 16px;
    `}
                >
                  <span
                    style={`
        color: #7dd56f;
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                  >
                    {getValue(value.min, value.unit)}
                  </span>
                  <span
                    style={`
        color: #7dd56f;
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                  >
                    {getValue(value.max, value.unit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 负面属性列 */}
        {data.negative ? (
          <div
            style={`
          flex: 1;
        `}
          >
            <div
              style={`
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              padding: 0 4px;
            `}
            >
              <h3
                style={`
              margin: 0;
              color: #e35f5f;
              font-size: 16px;
              font-weight: 600;
            `}
              >
                负面属性
              </h3>
              <div
                style={`
              display: flex;
              gap: 12px;
            `}
              >
                <span
                  style={`
                color: #888;
                font-size: 12px;
              `}
                >
                  最小
                </span>
                <span
                  style={`
                color: #888;
                font-size: 12px;
              `}
                >
                  最大
                </span>
              </div>
            </div>
            <div
              style={`
              display: flex;
              flex-direction: column;
              gap: 4px;
            `}
            >
              {Object.entries(data.negative).map(([key, value]) => (
                <div
                  style={`
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      background-color: #16213e;
      border-radius: 4px;
      border-left: 3px solid #e35f5f;
    `}
                >
                  <span
                    style={`
      color: #e0e0e0;
      font-size: 13px;
    `}
                  >
                    {value.name}
                  </span>
                  <div
                    style={`
      display: flex;
      gap: 16px;
    `}
                  >
                    <span
                      style={`
        color: #e35f5f;
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                    >
                      {getValue(value.min, value.unit)}
                    </span>
                    <span
                      style={`
        color: #e35f5f;
        font-size: 13px;
        font-weight: 500;
        min-width: 60px;
        text-align: right;
      `}
                    >
                      {getValue(value.max, value.unit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <></>
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
