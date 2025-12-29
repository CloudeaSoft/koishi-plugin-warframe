import worldStateJSON from "../src/assets/exampleWorldState.json";
import { getWorldState } from "../src/api/wf-api";
import { getVoidTraderItem } from "../src/utils";
import { expect } from "chai";

describe("Void Trader Item Map Tests", function () {
  this.timeout(10000);
  it("should correctly map all void trader inventory item names", async () => {
    const worldState = await getWorldState(JSON.stringify(worldStateJSON));
    const trader = worldState.voidTraders[0];

    trader.inventory.forEach((element) => {
      const item = getVoidTraderItem(element);
      expect(item.name).not.undefined;
    });
  });
});
