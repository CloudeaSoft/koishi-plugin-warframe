import { expect } from "chai";
import { getCircuitWeek } from "../src/services";

describe("getCircuitWeek Tests", () => {
  it("Should return an object with correct shape", () => {
    const result = getCircuitWeek();
    expect(result).to.have.property("currentIncarnons");
    expect(result).to.have.property("currentWarframes");
    expect(result).to.have.property("allIncarnons");
    expect(result).to.have.property("allWarframes");
  });

  it("Should return numeric indices for current week", () => {
    const result = getCircuitWeek();
    expect(result.currentIncarnons).to.be.a("number");
    expect(result.currentWarframes).to.be.a("number");
  });

  it("Should return arrays of arrays for all rewards", () => {
    const result = getCircuitWeek();
    expect(result.allIncarnons).to.be.an("array");
    expect(result.allWarframes).to.be.an("array");
    expect(result.allIncarnons.length).to.be.greaterThan(0);
    expect(result.allWarframes.length).to.be.greaterThan(0);
  });

  it("Should have currentIncarnons within valid range", () => {
    const result = getCircuitWeek();
    expect(result.currentIncarnons).to.be.gte(0);
    expect(result.currentIncarnons).to.be.lt(result.allIncarnons.length);
  });

  it("Should have currentWarframes within valid range", () => {
    const result = getCircuitWeek();
    expect(result.currentWarframes).to.be.gte(0);
    expect(result.currentWarframes).to.be.lt(result.allWarframes.length);
  });

  it("Should populate reward names with translated strings", () => {
    const result = getCircuitWeek();
    const firstIncarnonSet = result.allIncarnons[0];
    expect(firstIncarnonSet).to.be.an("array");
    expect(firstIncarnonSet.length).to.be.greaterThan(0);
    expect(firstIncarnonSet[0]).to.be.a("string");
  });
});
