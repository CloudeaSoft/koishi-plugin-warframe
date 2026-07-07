import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect } from "chai";

describe("wfm type ownership", () => {
  it("keeps WFM public types in wfm-api-client", () => {
    const oldTypesDir = resolve(process.cwd(), "src/types/wfm");

    expect(existsSync(oldTypesDir)).to.equal(false);
  });
});
