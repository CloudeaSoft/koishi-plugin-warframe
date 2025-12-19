import { fetchAsyncText } from "../utils";
import exampleWorldState from "../assets/exampleWorldState.json";
import WorldState from "warframe-worldstate-parser";
import Puppeteer from "koishi-plugin-puppeteer";

const apiBase = "https://api.warframe.com/cdn/";

export const getWorldState = async (): Promise<WorldState> => {
  const response = await fetchAsyncText(apiBase + "worldState.php");
  // return exampleWorldState;
  const WorldStateParser = await import("warframe-worldstate-parser");
  const ws = await WorldStateParser.WorldState.build(response);
  return ws;
};

export const getRelicsDropTable = async (
  puppe: Puppeteer
): Promise<Record<string, Relic>> => {
  const dropTableUrl = "https://www.warframe.com/droptables";
  const response = await fetchAsyncText(dropTableUrl);
  const relicList = (await puppe.render(response, async (p): Promise<any> => {
    const body = await p.waitForSelector("body");
    const title = await body.waitForSelector("#relicRewards");
    const result = await title.evaluate((el) => {
      const table = el.nextElementSibling;
      if (!table) {
        return null;
      }

      const relicList: ExternalRelic[] = [];
      let current: ExternalRelic = { items: [] } as any;
      for (const tr of table.children[0].children) {
        if (tr.className.includes("blank-row")) {
          relicList.push(current);
          current = { items: [] } as any;
          continue;
        }

        const first = tr.children[0];
        if (first.tagName.toLocaleLowerCase() === "th") {
          const splitRes = first.textContent.split("(");
          const name = splitRes[0].replace(/Relic$/, "").trim();
          const tier = name.split(" ")[0];
          const num = name.split(" ")[1] ?? ""; // Avoid trigger exception for some relic name "Requiem Relic"
          const quality = splitRes[1].split(")")[0].trim();
          current.tier = tier as any;
          current.num = num;
          current.quality = quality as any;
        } else {
          const rateStr = tr.children[1].textContent;
          const rate = parseFloat(rateStr.split("(")[1].split("%")[0]);
          current.items.push({ name: first.textContent, rate });
        }
      }

      return relicList;
    });

    return result;
  })) as any;

  const result: Record<string, Relic> = {};
  relicList.forEach((r: ExternalRelic) => {
    const nameKey = r.tier + r.num;
    if (!result[nameKey]) {
      result[nameKey] = {
        tier: r.tier,
        num: r.num,
        items: r.items.map((i) => {
          return {
            name: i.name,
            rate: {
              Intact: undefined,
              Exceptional: undefined,
              Flawless: undefined,
              Radiant: undefined,
            },
          };
        }),
      };
    }

    const itemsMap = new Map(
      result[nameKey].items.map((item) => [item.name, item])
    );
    for (const target of r.items) {
      const item = itemsMap.get(target.name);
      item.rate[r.quality] = target.rate;
    }
  });

  return result;
};
