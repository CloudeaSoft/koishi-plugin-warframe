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
