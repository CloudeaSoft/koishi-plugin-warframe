import rivenAttrValues from "../../assets/rivenAttrValues.json";
import { normalizeName } from "../../utils";

export const rivenAttrValueDict: Record<
  string,
  Record<string, number>
> = (() => {
  const dict: Record<string, Record<string, number>> = {};
  for (const key in rivenAttrValues) {
    const attrs = rivenAttrValues[key as keyof typeof rivenAttrValues];
    dict[key] = {};
    for (const attrKey in attrs) {
      const removeDamageSuffix =
        attrKey.endsWith("Damage") &&
        attrKey !== "Damage" &&
        attrKey !== "Finisher Damage" &&
        !attrKey.startsWith("Critical");
      const wfmKey = removeDamageSuffix
        ? normalizeName(attrKey.replace("Damage", ""))
        : normalizeName(attrKey);
      dict[key][wfmKey] = attrs[attrKey as keyof typeof attrs];
    }
  }
  return dict;
})();
