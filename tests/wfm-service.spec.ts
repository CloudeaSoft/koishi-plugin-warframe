import { expect } from "chai";
import { inputToItem, setGlobalItem } from "../src/services";

import testItems from "./assets/test-items.json";

before(() => {
  setGlobalItem(testItems.data);
});

it("wfm-service.inputToItem", () => {
  const inputToItemTestCases = [
    { a: "瓦喵蓝图", b: "Valkyr Prime 蓝图" },
    { a: "ashp", b: "Ash Prime 一套" },
    { a: "牛P", b: "Rhino Prime 一套" },
    { a: "膛室", b: "膛室 Prime" },
    { a: "abc", b: undefined },
  ];

  inputToItemTestCases.forEach((element) => {
    const input = element.a;
    const predict = element.b;
    const output = inputToItem(input);
    if (typeof output === "undefined" && predict === undefined) {
      expect(output).to.be.equal(predict);
    } else {
      expect(output?.i18n["zh-hans"].name).to.be.equal(predict);
    }
  });
});
