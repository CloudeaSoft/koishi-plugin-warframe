import { Baro } from "../../assets/baro";
import { fetchAsyncText } from "../../utils";
import WorldState from "warframe-worldstate-parser";

const apiBase = "https://api.warframe.com/cdn/";

export const getWorldState = async (json?: string): Promise<WorldState> => {
  if (!json) {
    json = await fetchAsyncText(apiBase + "worldState.php");
  }

  if (!json) {
    throw new Error("获取游戏信息失败");
  }

  const WorldStateParser = await import("warframe-worldstate-parser");
  return await WorldStateParser.WorldState.build(json);
};

export const getVoidTraderHistory = async (
  data?: string,
): Promise<VoidTraderData | undefined> => {
  /**
   * Parses the Lua-like table format used in baro2.ts into a VoidTraderData object.
   *
   * Format example:
   *   [""Item Name""] = {
   *       Name = ""Item Name"",
   *       DucatCost = 100,
   *       OfferingDates = { ""2025-01-01"", ""2025-02-01"" },
   *   },
   *
   * - String values are delimited by "" (double double-quotes)
   * - Arrays are enclosed in { } with comma-separated values
   * - Top-level keys are enclosed in [""...""]
   */
  function parseBaroLuaTable(text: string): VoidTraderData {
    const result: VoidTraderData = {};
    const pos = { i: 0 };

    while (pos.i < text.length) {
      skipSpacesCommas(text, pos);
      if (pos.i >= text.length) break;

      // Expect top-level key: [""key""]
      if (text[pos.i] !== "[") {
        pos.i++;
        continue;
      }
      pos.i++; // skip '['

      // Expect opening ""
      if (text[pos.i] !== '"' || text[pos.i + 1] !== '"') {
        pos.i++;
        continue;
      }
      pos.i += 2; // skip opening ""

      // Read key string (until "")
      let key = "";
      while (
        pos.i < text.length &&
        !(text[pos.i] === '"' && text[pos.i + 1] === '"')
      ) {
        key += text[pos.i];
        pos.i++;
      }
      if (pos.i >= text.length) break;
      pos.i += 2; // skip closing ""

      // Expect ]
      if (text[pos.i] !== "]") continue;
      pos.i++; // skip ']'

      // Expect =
      while (pos.i < text.length && text[pos.i] !== "=") pos.i++;
      if (pos.i >= text.length) break;
      pos.i++; // skip '='

      // Expect {
      while (pos.i < text.length && text[pos.i] !== "{") pos.i++;
      if (pos.i >= text.length) break;
      pos.i++; // skip '{'

      // Parse the item's fields
      const { item, endPos } = parseItemFields(text, pos.i);
      result[key] = item;
      pos.i = endPos;

      // Skip closing '}'
      if (pos.i < text.length && text[pos.i] === "}") pos.i++;
    }

    return result;
  }

  /**
   * Skips whitespace characters and commas at the current position (mutates pos).
   */
  function skipSpacesCommas(text: string, pos: { i: number }): void {
    while (
      pos.i < text.length &&
      (text[pos.i] === " " ||
        text[pos.i] === "\n" ||
        text[pos.i] === "\r" ||
        text[pos.i] === "\t" ||
        text[pos.i] === ",")
    ) {
      pos.i++;
    }
  }

  /**
   * Parses the fields of a single baro item from the content inside { }.
   * Returns the parsed item and the position right before the closing '}'.
   */
  function parseItemFields(
    text: string,
    startPos: number,
  ): { item: VoidTraderItem; endPos: number } {
    const raw: Record<string, unknown> = {};
    let i = startPos;

    while (i < text.length) {
      i = skipSpacesCommasReturn(text, i);
      if (i >= text.length) break;
      if (text[i] === "}") break;

      // Read field name (alphanumeric characters)
      let fieldName = "";
      while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) {
        fieldName += text[i];
        i++;
      }

      if (!fieldName) {
        i++;
        continue;
      }

      // Expect =
      while (i < text.length && text[i] !== "=") i++;
      if (i >= text.length) break;
      i++; // skip '='

      i = skipSpacesCommasReturn(text, i);

      // Parse value: could be array { ... }, string ""..."", or number
      if (text[i] === "{") {
        // Array value
        i++; // skip '{'
        const arrayValues: string[] = [];

        while (i < text.length) {
          i = skipSpacesCommasReturn(text, i);
          if (i >= text.length) break;
          if (text[i] === "}") {
            i++;
            break;
          }

          // Expect string value delimited by ""
          if (text[i] === '"' && text[i + 1] === '"') {
            i += 2;
            let val = "";
            while (
              i < text.length &&
              !(text[i] === '"' && text[i + 1] === '"')
            ) {
              val += text[i];
              i++;
            }
            i += 2; // skip closing ""
            arrayValues.push(val);
          } else {
            i++; // skip unexpected char
          }
        }

        raw[fieldName] = arrayValues;
      } else if (text[i] === '"' && text[i + 1] === '"') {
        // String value
        i += 2; // skip opening ""
        let val = "";
        while (i < text.length && !(text[i] === '"' && text[i + 1] === '"')) {
          val += text[i];
          i++;
        }
        i += 2; // skip closing ""
        raw[fieldName] = val;
      } else {
        // Number value
        let numStr = "";
        while (i < text.length && /[0-9.eE\-+]/.test(text[i])) {
          numStr += text[i];
          i++;
        }
        raw[fieldName] = Number(numStr);
      }
    }

    return {
      item: assignItemFields(raw),
      endPos: i,
    };
  }

  /**
   * Skips whitespace characters and commas at the current position (returns new position).
   */
  function skipSpacesCommasReturn(text: string, i: number): number {
    while (
      i < text.length &&
      (text[i] === " " ||
        text[i] === "\n" ||
        text[i] === "\r" ||
        text[i] === "\t" ||
        text[i] === ",")
    ) {
      i++;
    }
    return i;
  }

  function assignItemFields(raw: Record<string, unknown>): VoidTraderItem {
    return {
      Name: (raw["Name"] as string) ?? "",
      Type: (raw["Type"] as string) ?? "",
      DucatCost: (raw["DucatCost"] as number) ?? 0,
      CreditCost: (raw["CreditCost"] as number) ?? 0,
      Image: (raw["Image"] as string) ?? "",
      Link: (raw["Link"] as string) ?? "",
      OfferingDates: raw["OfferingDates"] as string[] | undefined,
      PcOfferingDates: raw["PcOfferingDates"] as string[] | undefined,
      ConsoleOfferingDates: raw["ConsoleOfferingDates"] as string[] | undefined,
    };
  }

  if (!data) {
    data = await fetchAsyncText(
      "https://docs.google.com/spreadsheets/d/1cdT7M2qbOhZ01AQT2RaH8_6VL1yww4BHkTRtLzqZ7_g/export?format=csv&gid=564427308",
    );

    if (!data) {
      return parseBaroLuaTable(Baro);
    }

    data = data.slice(1, data.length - 1);
  }

  return parseBaroLuaTable(data);
};

interface VoidTraderItem {
  Name: string;
  Type: string;
  DucatCost: number;
  CreditCost: number;
  Image: string;
  Link: string;
  OfferingDates?: string[];
  PcOfferingDates?: string[];
  ConsoleOfferingDates?: string[];
}

// 最终转换出来的字典结构
interface VoidTraderData {
  [itemName: string]: VoidTraderItem;
}
