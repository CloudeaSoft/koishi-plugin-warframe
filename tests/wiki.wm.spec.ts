import { getVoidTraderHistory } from "../src/infrastructure/wf/wf-api";
import { expect } from "chai";
import { Baro } from "../src/assets/baro";

describe("Wiki void trader history parse test", async function () {
  it("Should not return empty", async () => {
    const result = await getVoidTraderHistory(Baro);
    expect(result).to.not.equal(undefined);

    const newData: { Name: string; Last: string }[] = [];
    for (const key in result) {
      const item = result[key];
      if (item.Name.startsWith("Primed") && item.Type.includes("Mod")) {
        newData.push({
          Name: item.Name,
          Last: item.OfferingDates?.at(-1) ?? "",
        });
      }
    }

    newData.sort(
      (a, b) => new Date(a.Last).getTime() - new Date(b.Last).getTime(),
    );

    expect(newData.length).to.be.greaterThan(0);
  });
});
