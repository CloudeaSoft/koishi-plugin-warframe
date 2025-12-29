import { dict_zh } from "warframe-public-export-plus";
import { relicEraToTransKey } from "./wf-export-adapter";
import { toPascalCase } from "./text";

export const relicToFullNameZH = (tier: string, category: string) => {
  return `${
    dict_zh[relicEraToTransKey(tier)] ?? toPascalCase(tier)
  } ${category} 遗物`;
};
