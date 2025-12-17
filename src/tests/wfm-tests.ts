import { inputToItem } from "../services/wfm-service";

export const inputToItemTestCases = [
  { a: "瓦喵蓝图", b: "Valkyr Prime 蓝图" },
  { a: "ashp", b: "Ash Prime 一套" },
  { a: "牛P", b: "Rhino Prime 一套" },
  { a: "膛室", b: "膛室 Prime" },
];

export const inputToItemTest = (input: string, predict: string | undefined) => {
  const test1Res = inputToItem(input);
  if (typeof test1Res === "undefined" && predict === undefined) {
    return {
      status: true,
    };
  }

  if (test1Res.i18n["zh-hans"].name === predict) {
    return {
      status: true,
    };
  }

  return {
    status: false,
    msg: `Mismatch: "${test1Res.i18n["zh-hans"].name}" != "${predict}"`,
  };
};
