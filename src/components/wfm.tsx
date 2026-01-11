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
          } Hi! I want to buy: "${item.i18n["en"].name}${
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

export const RivenOrderOutput = (
  item: RivenItem,
  orders: RivenOrderInternal[]
): Element => {
  const itemNameCN = item.i18n["zh-hans"].name;
  const itemNameEN = item.i18n["en"].name;
  return (
    <div style={"display:flex; flex-direction: column; font-size: 12px;"}>
      <h1 style={"text-align: center;"}>
        {itemNameCN} / {itemNameEN} (ID: {item.slug})
      </h1>
      <ul style={"width:100%;"}>
        {orders.map((order) => {
          return RivenOrderComponent(item, order);
        })}
      </ul>
    </div>
  );
};

const RivenOrderComponent = (
  item: RivenItem,
  order: RivenOrderInternal
): Element => {
  const itemNameCN = item.i18n["zh-hans"]?.name ?? item.i18n["en"].name;
  const itemIconLink =
    "https://warframe.market/static/assets/" + item.i18n["en"].thumb;
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
  };
  const statusText = statusData[order.owner.status][0];
  const statusColor = statusData[order.owner.status][1];

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
  index: number
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
