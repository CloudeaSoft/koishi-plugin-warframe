import { expect } from "chai";
import { stringToWFMItem } from "../src/services";

import testItems from "./assets/test-items.json";
import {
  overrideGlobalItemData,
  globalItemDataFactory,
} from "../src/domain/wfm/globalItem";
import { createAsyncCache } from "../src/utils";

before(() => {
  overrideGlobalItemData(
    createAsyncCache(async () => {
      return await globalItemDataFactory(testItems);
    }, -1) as any
  );
});

it("wfm-service.inputToItem", async () => {
  const inputToItemTestCases = [
    { a: "瓦喵蓝图", b: "Valkyr Prime 蓝图" },
    { a: "ashp", b: "Ash Prime 一套" },
    { a: "牛P", b: "Rhino Prime 一套" },
    { a: "膛室", b: "膛室 Prime" },
    { a: "abc", b: undefined },
    { a: "龙头", b: "Chroma Prime 头部神经光元 蓝图" },
    { a: "电系统", b: "Volt Prime 系统 蓝图" },
  ];

  for (const element of inputToItemTestCases) {
    const input = element.a;
    const predict = element.b;
    const output = await stringToWFMItem(input);
    if (typeof output === "undefined" && predict === undefined) {
      expect(output).to.be.equal(predict);
    } else {
      expect(output?.i18n["zh-hans"].name).to.be.equal(predict);
    }
  }
});
