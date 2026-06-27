import { expect } from "chai";
import { lerp, hexToRgb, rgbToHex } from "../src/utils/color";

describe("lerp Tests", () => {
  it("Should return start when t=0", () => {
    expect(lerp(10, 20, 0)).to.equal(10);
  });

  it("Should return end when t=1", () => {
    expect(lerp(10, 20, 1)).to.equal(20);
  });

  it("Should interpolate at t=0.5", () => {
    expect(lerp(0, 100, 0.5)).to.equal(50);
  });

  it("Should round to nearest integer", () => {
    expect(lerp(0, 10, 0.55)).to.equal(6);
  });

  it("Should extrapolate beyond [0,1] without clamping", () => {
    expect(lerp(0, 10, 2)).to.equal(20);
    expect(lerp(0, 10, -1)).to.equal(-10);
  });

  it("Should handle negative values", () => {
    expect(lerp(-10, 10, 0.5)).to.equal(0);
  });
});

describe("hexToRgb Tests", () => {
  it("Should parse standard hex color", () => {
    expect(hexToRgb("#ff0000")).to.deep.equal({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("#00ff00")).to.deep.equal({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#0000ff")).to.deep.equal({ r: 0, g: 0, b: 255 });
  });

  it("Should parse uppercase hex", () => {
    expect(hexToRgb("#FF8800")).to.deep.equal({ r: 255, g: 136, b: 0 });
  });

  it("Should parse mixed case hex", () => {
    expect(hexToRgb("#aB3F1e")).to.deep.equal({ r: 171, g: 63, b: 30 });
  });

  it("Should parse black and white", () => {
    expect(hexToRgb("#000000")).to.deep.equal({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#ffffff")).to.deep.equal({ r: 255, g: 255, b: 255 });
  });
});

describe("rgbToHex Tests", () => {
  it("Should convert basic RGB to hex", () => {
    expect(rgbToHex(255, 0, 0)).to.equal("#ff0000");
    expect(rgbToHex(0, 255, 0)).to.equal("#00ff00");
    expect(rgbToHex(0, 0, 255)).to.equal("#0000ff");
  });

  it("Should pad single-digit channels", () => {
    expect(rgbToHex(0, 0, 0)).to.equal("#000000");
    expect(rgbToHex(1, 2, 3)).to.equal("#010203");
  });

  it("Should convert white and black", () => {
    expect(rgbToHex(255, 255, 255)).to.equal("#ffffff");
    expect(rgbToHex(0, 0, 0)).to.equal("#000000");
  });

  it("Should convert arbitrary values", () => {
    expect(rgbToHex(171, 63, 30)).to.equal("#ab3f1e");
  });
});

describe("hexToRgb <-> rgbToHex round-trip", () => {
  it("Should be reversible for various colors", () => {
    const colors = ["#ff0000", "#00ff00", "#ab3f1e", "#ffffff", "#000000"];
    for (const hex of colors) {
      const { r, g, b } = hexToRgb(hex);
      expect(rgbToHex(r, g, b)).to.equal(hex);
    }
  });
});
