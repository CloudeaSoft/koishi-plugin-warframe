import { expect } from "chai";
import {
  fissureTierName,
  fissureTierNumToNumber,
  getVoidTraderItem,
} from "../src/infrastructure/wf/wfcd-adapter";

describe("fissureTierName Tests", () => {
  it("Should contain tiers 1-7", () => {
    expect(fissureTierName[1]).to.equal("/Lotus/Language/Relics/Era_LITH");
    expect(fissureTierName[2]).to.equal("/Lotus/Language/Relics/Era_MESO");
    expect(fissureTierName[3]).to.equal("/Lotus/Language/Relics/Era_NEO");
    expect(fissureTierName[4]).to.equal("/Lotus/Language/Relics/Era_AXI");
    expect(fissureTierName[5]).to.equal("/Lotus/Language/Relics/Era_REQUIEM");
    expect(fissureTierName[6]).to.equal("/Lotus/Language/Relics/Era_OMNI");
    expect(fissureTierName[7]).to.equal(
      "/Lotus/Language/Relics/Era_VANGUARD",
    );
  });
});

describe("fissureTierNumToNumber Tests", () => {
  it("Should pass through numeric input", () => {
    expect(fissureTierNumToNumber(1)).to.equal(1);
    expect(fissureTierNumToNumber(4)).to.equal(4);
    expect(fissureTierNumToNumber(7)).to.equal(7);
  });

  it("Should convert string input using charCodeAt(5)", () => {
    // charCodeAt(5): index 5 of "tier01" is '1' (charCode 49)
    expect(fissureTierNumToNumber("tier01")).to.equal(49);
    // index 5 of "tier04" is '4' (charCode 52)
    expect(fissureTierNumToNumber("tier04")).to.equal(52);
  });
});

describe("getVoidTraderItem Tests", () => {
  it("Should map an item with name, ducats, and credits", () => {
    const input = {
      item: "Fallback Name",
      uniqueName: "/Lotus/Weapons/Warframes/TestWeapon",
      ducats: 100,
      credits: 5000,
    };
    const result = getVoidTraderItem(input);
    expect(result.ducats).to.equal(100);
    expect(result.credits).to.equal(5000);
    expect(result.name).to.be.a("string");
  });

  it("Should use fallback item name when uniqueName is unknown", () => {
    const input = {
      item: "My Fallback",
      uniqueName: "/NonExistent/Item",
      ducats: 50,
      credits: 2500,
    };
    const result = getVoidTraderItem(input);
    expect(result.name).to.equal("My Fallback");
  });

  it("Should handle StoreItems prefix in uniqueName", () => {
    const input = {
      item: "Fallback",
      uniqueName: "/Lotus/StoreItems/Weapons/SomeWeapon",
      ducats: 75,
      credits: 3000,
    };
    const result = getVoidTraderItem(input);
    expect(result.ducats).to.equal(75);
    expect(result.credits).to.equal(3000);
  });
});
