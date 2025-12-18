import { Context } from "koishi";
import mock from "@koishijs/plugin-mock";
import * as warframe from "../src/index";

import { expect } from "chai";
import { inputToItem, setGlobalItem } from "../src/services";
import { setTestMode } from "../src/index";

import testItems from "./assets/test-items.json";

const app = new Context();
// @ts-ignore
app.plugin(mock);
app.plugin(warframe);

const client = app.mock.client("123");

app.middleware(({ content }, next) => {
  if (content === "天王盖地虎") {
    return "宝塔镇河妖";
  } else {
    return next();
  }
});

before(() => {
  setTestMode();
  app.start();
});

setGlobalItem(testItems.data);

it("example test", async () => {
  // chai 原生写法
  expect(1 + 1).to.be.equal(2);

  // 将“天王盖地虎”发送给机器人将会获得“宝塔镇河妖”的回复
  await client.shouldReply("天王盖地虎", "宝塔镇河妖");

  // 将“天王盖地虎”发送给机器人将会获得某些回复
  await client.shouldReply("天王盖地虎");

  // 将“宫廷玉液酒”发送给机器人将不会获得任何回复
  await client.shouldNotReply("宫廷玉液酒");
});

it("wfm-service.inputToItem", () => {
  const inputToItemTestCases = [
    { a: "瓦喵蓝图", b: "Valkyr Prime 蓝图" },
    { a: "ashp", b: "Ash Prime 一套" },
    { a: "牛P", b: "Rhino Prime 一套" },
    { a: "膛室", b: "膛室 Prime" },
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
