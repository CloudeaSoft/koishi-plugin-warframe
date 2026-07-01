import { expect } from "chai";
import {
  toTimeStamp,
  msToHumanReadable,
  sleep,
} from "../src/utils/time";

describe("toTimeStamp Tests", () => {
  it("Should convert valid ISO date string", () => {
    const ts = toTimeStamp("2024-01-01T00:00:00Z");
    expect(ts).to.equal(1704067200000);
  });

  it("Should convert date-only string", () => {
    const ts = toTimeStamp("2024-06-15");
    expect(ts).to.be.a("number");
    expect(Number.isFinite(ts)).to.equal(true);
  });

  it("Should return NaN for invalid date string", () => {
    const ts = toTimeStamp("not-a-date");
    expect(Number.isNaN(ts)).to.equal(true);
  });
});

describe("msToHumanReadable Tests", () => {
  it("Should return '0秒' for 0", () => {
    expect(msToHumanReadable(0)).to.equal("0秒");
  });

  it("Should return '0秒' for negative input (clamped to 0)", () => {
    expect(msToHumanReadable(-1000)).to.equal("0秒");
  });

  it("Should return '0秒' for NaN input (coerced to 0)", () => {
    expect(msToHumanReadable(NaN)).to.equal("0秒");
  });

  it("Should return '0秒' for non-numeric input", () => {
    expect(msToHumanReadable("abc" as unknown as number)).to.equal("0秒");
  });

  it("Should format seconds only", () => {
    expect(msToHumanReadable(5000)).to.equal("5秒");
  });

  it("Should format hours + minutes + seconds", () => {
    expect(msToHumanReadable(3661000)).to.equal("1小时1分钟1秒");
  });

  it("Should format days + hours + minutes + seconds", () => {
    expect(msToHumanReadable(90061000)).to.equal("1天1小时1分钟1秒");
  });

  it("Should skip zero-value units (days/hours/minutes) but always show seconds", () => {
    expect(msToHumanReadable(3600000)).to.equal("1小时0秒");
    expect(msToHumanReadable(86400000)).to.equal("1天0秒");
  });

  it("Should handle sub-second milliseconds (floored to 0 seconds)", () => {
    expect(msToHumanReadable(500)).to.equal("0秒");
    expect(msToHumanReadable(999)).to.equal("0秒");
  });
});

describe("sleep Tests", function () {
  this.timeout(5000);

  it("Should resolve after the specified duration", async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.gte(40);
  });

  it("Should resolve even with 0ms", async () => {
    await sleep(0);
  });

  it("Should return a Promise", () => {
    const p = sleep(1);
    expect(p).to.be.instanceOf(Promise);
    return p;
  });
});
