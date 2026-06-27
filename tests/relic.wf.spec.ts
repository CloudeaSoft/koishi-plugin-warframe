import { expect } from "chai";
import { getRelic } from "../src/services";

describe("getRelic Tests", function () {
  this.timeout(10000);

  it("Should return error for empty input", async () => {
    const result = await getRelic("");
    expect(result).to.equal("请提供正确的遗物名称");
  });

  it("Should return error for whitespace-only input", async () => {
    const result = await getRelic("   ");
    expect(result).to.equal("请提供正确的遗物名称");
  });

  it("Should return error for input without a valid tier", async () => {
    const result = await getRelic("InvalidRelic");
    expect(result).to.equal("请提供正确的遗物名称");
  });

  it("Should accept Chinese tier names (古纪)", async () => {
    const result = await getRelic("古纪A1");
    expect(result).to.not.be.a("string");
    expect((result as any).tier).to.equal("Lith");
  });

  it("Should accept Chinese tier names (前纪)", async () => {
    const result = await getRelic("前纪A1");
    expect(result).to.not.be.a("string");
    expect((result as any).tier).to.equal("Meso");
  });

  it("Should accept Chinese tier names (中纪)", async () => {
    const result = await getRelic("中纪A1");
    expect(result).to.not.be.a("string");
    expect((result as any).tier).to.equal("Neo");
  });

  it("Should accept Chinese tier names (后纪)", async () => {
    const result = await getRelic("后纪A1");
    expect(result).to.not.be.a("string");
    expect((result as any).tier).to.equal("Axi");
  });

  it("Should accept English tier names (Lith)", async () => {
    const result = await getRelic("LithA1");
    expect(result).to.not.be.a("string");
    expect((result as any).tier).to.equal("Lith");
  });

  it("Should accept English tier names (Axi)", async () => {
    const result = await getRelic("AxiA1");
    expect(result).to.not.be.a("string");
    expect((result as any).tier).to.equal("Axi");
  });

  it("Should strip trailing '遗物' suffix", async () => {
    const result1 = await getRelic("古纪A1");
    const result2 = await getRelic("古纪A1遗物");
    if (typeof result1 !== "string" && typeof result2 !== "string") {
      expect(result1.num).to.equal(result2.num);
    }
  });

  it("Should strip trailing 'relic' suffix (case-insensitive)", async () => {
    const result1 = await getRelic("LithA1");
    const result2 = await getRelic("LithA1relic");
    if (typeof result1 !== "string" && typeof result2 !== "string") {
      expect(result1.num).to.equal(result2.num);
    }
  });

  it("Should return error for valid tier but nonexistent relic", async () => {
    const result = await getRelic("古纪NONEXISTENT999");
    expect(result).to.equal("未找到对应遗物信息");
  });

  it("Should return relic with items array", async () => {
    const result = await getRelic("古纪A1");
    if (typeof result !== "string") {
      expect(result.items).to.be.an("array");
      expect(result.items.length).to.be.greaterThan(0);
      expect(result.tierKey).to.include("/Lotus/Language/Relics/Era_");
    }
  });
});
