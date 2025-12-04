import { Element } from "koishi";
import { Arby } from "../types/arby";

export const ArbiTable = (arbi: Arby[]): Element => {
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
                  {`${a.value}-${a.type} (${a.faction})`.replace(/\(|\)/g, "")}
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
