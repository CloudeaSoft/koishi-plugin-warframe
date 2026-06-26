import Element from "@satorijs/element";
import { ItemShort, PrimedModHistoryItem, RivenItem } from "../types/wfm/item";
import { OrderWithUser } from "../types/wfm/order";
import {
  RivenOrderInternal,
  RivenAttributeShortInternal,
} from "../types/wfm/riven";

export const ItemOrderComponent = (
  item: ItemShort,
  orders: OrderWithUser[],
): Element => {
  const itemNameCN = item.i18n["zh-hans"]?.name;
  const itemNameEN = item.i18n["en"]?.name;
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
          <th style="width:40%;">玩家名</th>
          <th style="width:30%;">状态</th>
          <th style="width:10%;">价格</th>
          <th style="width:10%;">数量</th>
          <th style="width:10%;">好评</th>
        </tr>
        {orders.map((order) => (
          <tr>
            <td>{order.user.ingameName}</td>
            <td>{order.user.status}</td>
            <td>{order.platinum}</td>
            <td>{order.quantity}</td>
            <td>{order.user.reputation}</td>
          </tr>
        ))}
      </table>
      <div style={"text-align: center; margin-top: 30px; font-size: 25px;"}>
        {(() => {
          const firstOrder = orders[0];
          const comment = `/w ${
            firstOrder.user.ingameName
          } Hi! I want to buy: "${itemNameEN}${
            !item.maxRank || item.maxRank === 0
              ? ""
              : ` (rank ${firstOrder.rank})`
          }" for ${firstOrder.platinum} platinum. (warframe.market)`;
          return comment;
        })()}
      </div>
    </div>
  );
};

export const RivenOrderComponent = (
  item: RivenItem,
  orders: RivenOrderInternal[],
): Element => {
  const itemNameCN = item.i18n ? item.i18n["zh-hans"]?.name : undefined;
  const itemNameEN = item.i18n ? item.i18n["en"]?.name : undefined;
  const itemThumb = item.i18n ? item.i18n["en"]?.thumb : undefined;
  return (
    <div style={"display:flex; flex-direction: column; font-size: 12px;"}>
      <h1 style={"text-align: center;"}>
        {itemNameCN} / {itemNameEN} (ID: {item.slug})
      </h1>
      <ul style={"width:100%;"}>
        {orders.map((order) => {
          return RivenOrderItemComponent(
            order,
            itemNameCN,
            itemNameEN,
            itemThumb,
          );
        })}
      </ul>
    </div>
  );
};

const RivenOrderItemComponent = (
  order: RivenOrderInternal,
  cnName?: string,
  enName?: string,
  thumb?: string,
): Element => {
  const itemNameCN = cnName ?? enName;
  const itemIconLink = thumb
    ? "https://warframe.market/static/assets/" + thumb
    : undefined;
  const ownerAvatarLink = order.owner.avatar
    ? "https://warframe.market/static/assets/" + order.owner.avatar
    : undefined;

  const reputationColor = order.owner.reputation >= 5 ? "#00a96c" : "#739098";
  const reputationIconLink =
    order.owner.reputation >= 5 ? "#icon-smile" : "#icon-meh";

  const statusData = {
    ingame: ["ONLINE IN GAME", "#634b93"],
    online: ["ONLINE", "darkgreen"],
    offline: ["OFFLINE", "darkred"],
    _: ["UNKNOWN", "grey"],
  };
  const status =
    order.owner.status in statusData
      ? (order.owner.status as keyof typeof statusData)
      : "_";
  const statusText = statusData[status][0];
  const statusColor = statusData[status][1];

  return (
    <div style="border: 1px solid gray; margin: 20px; padding: 10px 15px 10px 11px; font-family: 'Lato', sans-serif, Helvetica, Arial; display: flex; flex-direction: column;">
      <div style="display: flex; align-items: center; padding-bottom: 10px; min-height: 45px;">
        <img
          src={itemIconLink}
          style="height: 30px; width: 30px; object-fit: contain; border-radius: 50%; box-shadow: 0 0 10px 1px rgba(0, 0, 0, .15); vertical-align: middle;"
        />
        <span
          id="title"
          style="margin-left: 15px; font-size: 16px; line-height: 16px; font-weight: 700; text-overflow: ellipsis; text-decoration: underline; cursor: pointer;"
        >
          {itemNameCN} {order.item.name}
        </span>
      </div>
      <div
        id="body"
        style="display: flex; flex-wrap: wrap; justify-content: space-between;"
      >
        <div id="body-left">
          <ul style="display: flex; padding-top: 5px;">
            {order.item.attributes
              .filter((attr) => attr.positive)
              .map(RivenAttributeComponent)}
          </ul>
          <ul style="display: flex; width: 100%; padding-top: 5px;">
            {order.item.attributes
              .filter((attr) => !attr.positive)
              .map(RivenAttributeComponent)}
          </ul>
          <ul style="display: flex; padding: 5px 0; font-size: 12px;">
            <li style="margin-right: 10px;">
              <span>段位 </span>
              <b>{order.item.mastery_level}</b>
            </li>
            <li style="margin-right: 10px;">
              <span>等级: </span>
              <b>{order.item.mod_rank}</b>
            </li>
            <li style="margin-right: 10px;">
              <span>循环: </span>
              <b>{order.item.re_rolls}</b>
            </li>
            <li style="margin-right: 10px;">
              <span>极性: </span>
              <b>
                <svg
                  viewBox="0 0 18 18"
                  style="
                color: rgb(64 64 64 / 75%);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
                >
                  <use href={`#icon-${order.item.polarity}`}></use>
                </svg>
              </b>
            </li>
          </ul>
        </div>
        <div
          id="body-right"
          style="display: flex; flex-direction: column; justify-content: center; padding-left: 10px;"
        >
          <div style="display: flex; justify-content: flex-end; font-size: 16px;">
            <span>售价: </span>
            <div style="padding-left: 5px; line-height: 1.5;">
              <b>{order.starting_price}</b>
              <svg
                viewBox="0 0 215.535 215.535"
                style="
                margin: 0 0 0 3px;
                color: rgb(64 64 64 / 75%);
                height: 1em;
                width: 1em;
                vertical-align: -.125em;
                fill: currentcolor;"
              >
                <use href="#icon-platinum"></use>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div
        id="footer"
        style="display: flex; margin-top: 10px; line-height: 1.5;"
      >
        <div style="display: flex;">
          <img
            src={ownerAvatarLink}
            style="height: 20px; width: 20px; object-fit: contain; border-radius: 50%; box-shadow: 0 0 10px 1px rgba(0, 0, 0, .15); vertical-align: middle;"
          />
          <span style="margin-left: 5px;">{order.owner.ingame_name}</span>
        </div>
        <div
          style={`margin-left: 10px; color:${
            statusColor ?? "gray"
          }; font-size: 12px;`}
        >
          {statusText}
        </div>
        <div style={`margin-left: 10px; color:${reputationColor};`}>
          {order.owner.reputation}
          <svg
            viewBox="0 0 496 512"
            style={
              "margin-left: 5px; margin-top: -2px; overflow:hidden; height: 1em; width: 1em; vertical-align: -.125em; fill: currentcolor;"
            }
          >
            <use href={reputationIconLink}></use>
          </svg>
        </div>
      </div>
    </div>
  );
};

const RivenAttributeComponent = (
  attr: RivenAttributeShortInternal,
  index: number,
): Element => {
  const attrInfo = attr.attribute;
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
  const positiveColors = [
    "--color_rgb_attribute_background_first",
    "--color_rgb_attribute_background_second",
    "--color_rgb_attribute_background_third",
  ];
  const color = attr.positive
    ? positiveColors[index]
    : "--color_rgb_attribute_background_negative";

  return (
    <li
      style={`
        border: 1px solid rgb(var(${color})/50%);
        background-color: rgb(var(${color})/10%);
        color: rgb(var(${color}));
        padding: 2px 10px;
        border-radius: 4px;
        margin-right: 5px;
        font-size: 14px;
        line-height: 1.5;`}
    >
      <b>
        {attr.positive && !attrValuePrefix && attr.value > 0 ? "+" : ""}
        {attrValue}{" "}
      </b>
      <span>{attrName}</span>
    </li>
  );
};

const PMH_ITEMS_PER_COLUMN = 15;
const PMH_GRID_GAP = 6;

const getPriceTier = (
  plats: number,
): {
  borderColor: string;
  bgColor: string;
  label: string;
  textGlow?: string;
} => {
  if (plats > 250) {
    return {
      borderColor: "#ff6eb4",
      bgColor:
        "linear-gradient(135deg, rgba(255,110,180,0.18), rgba(110,200,255,0.18), rgba(255,230,80,0.18))",
      label: "legendary",
      textGlow: "0 0 6px rgba(255,110,180,0.6)",
    };
  }
  if (plats > 80) {
    return {
      borderColor: "#ff6b35",
      bgColor: "rgba(255,107,53,0.12)",
      label: "premium",
    };
  }
  if (plats > 60) {
    return {
      borderColor: "#f0c040",
      bgColor: "rgba(240,192,64,0.10)",
      label: "high",
    };
  }
  return { borderColor: "#d0d0d0", bgColor: "transparent", label: "normal" };
};

const calcDaysAgo = (dateStr: string): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const now = Date.now();
  const diff = now - d.getTime();
  return Math.floor(diff / 86400000);
};

const PMHCard = (item: PrimedModHistoryItem, index: number): Element => {
  const pr = item.plats;
  const tier =
    pr !== undefined
      ? getPriceTier(pr)
      : { borderColor: "#d0d0d0", bgColor: "transparent", label: "normal" };

  const dateStr = item.last
    ? (() => {
        const d = new Date(item.last);
        if (!isNaN(d.getTime())) {
          const year = d.getUTCFullYear();
          const month = String(d.getUTCMonth() + 1).padStart(2, "0");
          const day = String(d.getUTCDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        return item.last;
      })()
    : "";

  const daysAgo = calcDaysAgo(item.last);
  const isOld = daysAgo !== null && daysAgo > 90;

  const isLegendary = pr !== undefined && pr > 300;
  const showGlow = pr !== undefined && pr > 80;

  const cardContent = (
    <div
      style={`
        border-radius: 6px;
        padding: 6px 10px;
        background: ${isLegendary ? "linear-gradient(135deg, rgba(255,50,100,0.20), rgba(255,200,50,0.20), rgba(50,255,100,0.20), rgba(50,150,255,0.20), rgba(200,50,255,0.20))" : tier.bgColor};
        border-left: 4px solid ${tier.borderColor};
        box-shadow: ${showGlow ? (isLegendary ? "0 0 14px rgba(255,50,100,0.30), 0 0 28px rgba(200,50,255,0.20)" : `0 0 8px ${tier.borderColor}44`) : "0 1px 2px rgba(0,0,0,0.04)"};
        ${isLegendary ? "border-image: linear-gradient(135deg, #ff3264, #ffcc33, #33ff66, #3399ff, #cc33ff) 1; border-image-slice: 1; border-left: 4px solid transparent;" : ""}
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 11px;
        min-width: 0;
        overflow: hidden;
      `}
    >
      <div
        style={`
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        `}
      >
        <span style="overflow:hidden;text-overflow:ellipsis;">
          {item.name ?? "未知"}
        </span>
        {daysAgo ? (
          <span
            style={`flex-shrink:0;margin-left:4px;background:#eee;color:${isOld ? "#e05050" : "#999"};border-radius:3px;padding:0 5px;font-size:9px;font-weight:400;line-height:1.5;`}
          >
            距今{daysAgo}天
          </span>
        ) : null}
      </div>
      <div
        style={`
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-variant-numeric: tabular-nums;
        `}
      >
        <span style={`color: #888; font-size: 10px;`}>{dateStr || "未知"}</span>
        {pr !== undefined ? (
          <span
            style={`
              display: inline-flex;
              align-items: center;
              gap: 2px;
              font-weight: 700;
              font-size: 12px;
              color: #0d93b8;
              ${isLegendary ? "text-shadow: 0 0 6px rgba(255,50,100,0.7), 0 0 12px rgba(200,50,255,0.4);" : ""}
            `}
          >
            {pr}
            <svg
              viewBox="0 0 215.535 215.535"
              style="height: 0.85em; width: 0.85em; fill: currentcolor;"
            >
              <use href="#icon-platinum"></use>
            </svg>
          </span>
        ) : (
          <span style="color: #bbb; font-size: 10px;">暂无</span>
        )}
      </div>
    </div>
  );

  return cardContent;
};

export const PrimedModHistoryComponent = (
  history: PrimedModHistoryItem[],
): Element => {
  // 按 plats 降序排列（价格高的在前）
  const sorted = [...history].sort((a, b) => {
    const pa = a.plats ?? 0;
    const pb = b.plats ?? 0;
    if (pb !== pa) return pb - pa;
    return 0;
  });

  // 切分为每 15 个一列
  const columns: PrimedModHistoryItem[][] = [];
  for (let i = 0; i < sorted.length; i += PMH_ITEMS_PER_COLUMN) {
    columns.push(sorted.slice(i, i + PMH_ITEMS_PER_COLUMN));
  }

  return (
    <div
      style={`
        border-radius: 8px;
        padding: 16px;
        margin: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 100%;
        min-width: 320px;
        background: #ffffff;
      `}
    >
      {/* 标题 */}
      <div
        style={`
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        `}
      >
        <h1
          style={`
            font-size: 18px;
            font-weight: bold;
            margin: 0;
            color: #1a1a1a;
          `}
        >
          Prime Mod 历史记录
        </h1>
        <span style="color: #999; font-size: 11px;">{history.length} 项</span>
      </div>

      {/* 多列网格 */}
      <div
        style={`
          display: flex;
          gap: ${PMH_GRID_GAP}px;
          align-items: flex-start;
        `}
      >
        {columns.map((col) => (
          <div
            style={`
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 4px;
              min-width: 0;
            `}
          >
            {col.map((item, idx) => PMHCard(item, idx))}
          </div>
        ))}
      </div>
    </div>
  );
};
