import { fullWidthToHalfWidth } from "./index";

export const compareCNOrderName = (input: string, standard: string) => {
  // 1. 边界校验：空值/空字符串直接返回false（避免replace报错）
  if (
    !input ||
    !standard ||
    typeof input !== "string" ||
    typeof standard !== "string"
  ) {
    return false;
  }

  // 2. 标准化名称
  const normalizedInput = normalizeOrderName(input);
  const normalizedStandard = normalizeOrderName(standard);

  // 3. 避免空字符串匹配
  if (!normalizedInput || !normalizedStandard) return false;

  // 4. 特殊处理：移除“一套”二字
  const normalizedStandardNoSet = normalizedStandard.replace(/一套/g, "");
  const normalizedStandardNoSetSimplifiedPrime =
    normalizedStandardNoSet.replace(/prime/g, "p");
  return (
    normalizedInput === normalizedStandard ||
    normalizedInput === normalizedStandardNoSet ||
    normalizedInput === normalizedStandardNoSetSimplifiedPrime
  );
};

export const compareENOrderName = (input: string, standard: string) => {
  if (
    !input ||
    !standard ||
    typeof input !== "string" ||
    typeof standard !== "string"
  ) {
    return false;
  }

  const endWithSet = standard.toLowerCase().endsWith(" set");
  const standardNoSet = endWithSet ? standard.slice(0, -4) : standard;
  const standardSimplifiedPrime = standardNoSet.replace(/ Prime/g, "p");

  const normalizedInput = normalizeOrderName(input);
  const normalizedStandard = normalizeOrderName(standard);
  if (!normalizedInput || !normalizedStandard) return false;

  const normalizedStandardNoSet = normalizeOrderName(standardNoSet);
  const normalizedStandardSimplifiedPrime = normalizeOrderName(
    standardSimplifiedPrime
  );

  return (
    normalizedInput === normalizedStandard ||
    normalizedInput === normalizedStandardNoSet ||
    normalizedInput === normalizedStandardSimplifiedPrime
  );
};

export const compareRivenItemName = (input: string, standard: string) => {
  if (
    !input ||
    !standard ||
    typeof input !== "string" ||
    typeof standard !== "string"
  ) {
    return false;
  }

  // 2. 标准化名称
  const normalizedInput = normalizeOrderName(input);
  const normalizedStandard = normalizeOrderName(standard);

  if (!normalizedInput || !normalizedStandard) return false;

  return normalizedInput === normalizedStandard;
};

const normalizeOrderName = (str: string) => {
  // 全角转半角 → 转小写 → 过滤特殊字符 → 移除所有空白
  const normalize = (str: string) => {
    return fullWidthToHalfWidth(str)
      .toLowerCase() // 统一大小写
      .replace(/[·'\-+()【】\[\]{}，。！？；：_]/g, "") // 过滤冗余符号
      .replace(/\s+/g, ""); // 移除所有空白
  };

  return normalize(str);
};
