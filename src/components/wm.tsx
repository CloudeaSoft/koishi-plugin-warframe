import { globalRivenAttributeList } from "../services";
import Element from "@satorijs/element";

export const ItemOrderOutput = (
  item: ItemShort,
  orders: OrderWithUser[]
): Element => {
  const itemNameCN = item.i18n["zh-hans"].name;
  const itemNameEN = item.i18n["en"].name;
  let result = `物品: ${itemNameCN} / ${itemNameEN} (ID: ${item.slug})\n`;
  for (const order of orders) {
    result += `玩家: ${order.user.ingameName} 状态: ${order.user.status} 价格: ${order.platinum}\n`;
  }
  return (
    <div style={"display:flex; flex-direction: column;"}>
      <style>
        {`
          th {
            align-items: center;
            width:33%;
            font-size: 1.8rem;
          }

          td {
            text-align: center;
            font-size: 1.5rem;
          }

          tr {
            height: 3rem;
          }
          `}
      </style>
      <h1 style={"text-align: center;"}>
        {itemNameCN} / {itemNameEN} (ID: {item.slug})
      </h1>
      <table style={"width:100%;"}>
        <tr>
          <th>玩家名</th>
          <th>状态</th>
          <th>价格</th>
        </tr>
        {orders.map((order) => (
          <tr>
            <td>{order.user.ingameName}</td>
            <td>{order.user.status}</td>
            <td>{order.platinum}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};

const RivenOrderCard = (order: RivenOrder): Element => {
  return (
    <tr>
      <td style={"display:flex;justify-content:center;gap:10px"}>
        {order.item.attributes.map((attr, index) => {
          const attrInfo = globalRivenAttributeList.find(
            (e) => e.slug == attr.url_name
          );
          const attrName = attrInfo.i18n["zh-hans"].name;
          const attrValuePrefix = attrInfo.unit === "multiply" ? "x" : "";
          const unitSuffixMap = {
            percent: "%",
            second: "s",
            multiply: "",
          };
          const attrValueSuffix =
            unitSuffixMap[attrInfo.unit as keyof typeof unitSuffixMap] || "";
          const attrValue = attrValuePrefix + attr.value + attrValueSuffix;
          return (
            <p>
              <span>{index !== 0 ? " | " : ""}</span>
              <span style={`color:${attr.positive ? "darkgreen" : "red"};`}>
                {`${attrName} ${attrValue}`}
              </span>
            </p>
          );
        })}
      </td>
      <td>{order.starting_price}</td>
      <td>{order.owner.ingame_name}</td>
      <td>{order.owner.status}</td>
      <td>{order.item.mastery_level}</td>
      <td>{order.item.mod_rank}</td>
      <td>{order.item.re_rolls}</td>
      <td>{order.item.polarity}</td>
    </tr>
  );
};

export const RivenOrderOutput = (
  item: RivenItem,
  orders: RivenOrder[]
): Element => {
  const itemNameCN = item.i18n["zh-hans"].name;
  const itemNameEN = item.i18n["en"].name;
  return (
    <div style={"display:flex; flex-direction: column;"}>
      <style>
        {`
        th {
          align-items: center;
          width:33%;
          font-size: 1.8rem;
        }

        td {
          text-align: center;
          font-size: 1.2rem;
        }

        tr {
          height: 3rem;
        }
        `}
      </style>
      <h1 style={"text-align: center;"}>
        {itemNameCN} / {itemNameEN} (ID: {item.slug})
      </h1>
      <table style={"width:100%;"}>
        <tr>
          <th style={`width:65%;`}>属性</th>
          <th style={`width:4%;`}>价格</th>
          <th style={`width:16%;`}>玩家名</th>
          <th style={`width:4%;`}>状态</th>
          <th style={`width:2%`}>段位</th>
          <th style={`width:4%`}>等级</th>
          <th style={`width:3%`}>循环</th>
          <th style={`width:2%`}>极性</th>
        </tr>
        {orders.map(RivenOrderCard)}
      </table>
    </div>
  );
};

export const OutputImage = (imgBase64: string): Element => (
  <img src={`data:image/png;base64,${imgBase64}`} />
);
