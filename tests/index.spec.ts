import { App } from "koishi";
import mock from "@koishijs/plugin-mock";
import * as warframe from "../src/index";

const app = new App();
app.plugin(mock as any);
app.plugin(warframe, {
  developerMode: false,
  ocrAPISecret: {
    id: "",
    key: "",
  },
});

const client = app.mock.client("123");

app.middleware(({ content }, next) => {
  if (content === "天王盖地虎") {
    return "宝塔镇河妖";
  } else {
    return next();
  }
});

before(() => app.start());

describe("Main Project", function () {
  this.timeout(10000);

  it("example", async () => {
    await client.shouldReply("天王盖地虎", "宝塔镇河妖");
    await client.shouldReply("天王盖地虎");
    await client.shouldNotReply("宫廷玉液酒");
  });
});
