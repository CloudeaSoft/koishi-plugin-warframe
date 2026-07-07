import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { expect } from "chai";

describe("wfm client boundary", () => {
  it("uses a local client instance instead of WFM API wrapper functions", () => {
    const cwd = process.cwd();

    expect(existsSync(resolve(cwd, "src/infrastructure/wfm/wfm-api.ts"))).to.equal(false);
    expect(existsSync(resolve(cwd, "src/infrastructure/wfm/client.ts"))).to.equal(true);
  });
});
