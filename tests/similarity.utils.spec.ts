import { expect } from "chai";
import { normalSimilarity, tokenSimilarity } from "../src/utils/text";

describe("normalSimilarity Tests", () => {
  it("Should return 1 for identical strings", () => {
    expect(normalSimilarity("hello", "hello")).to.equal(1);
  });

  it("Should return 0 for completely different strings of same length", () => {
    expect(normalSimilarity("abc", "xyz")).to.equal(0);
  });

  it("Should return a value between 0 and 1 for partially similar strings", () => {
    const sim = normalSimilarity("hello", "hallo");
    expect(sim).to.be.greaterThan(0);
    expect(sim).to.be.lessThan(1);
  });

  it("Should handle single character difference", () => {
    const sim = normalSimilarity("kitten", "sitten");
    expect(sim).to.be.closeTo(5 / 6, 0.01);
  });

  it("Should return 0 when one string is empty and the other is not", () => {
    expect(normalSimilarity("", "abc")).to.equal(0);
    expect(normalSimilarity("abc", "")).to.equal(0);
  });

  it("Should handle CJK strings", () => {
    const sim = normalSimilarity("暴击率", "暴击几率");
    expect(sim).to.be.greaterThan(0);
    expect(sim).to.be.lessThan(1);
  });
});

describe("tokenSimilarity Tests", () => {
  it("Should return 1 for identical strings", () => {
    expect(tokenSimilarity("hello world", "hello world")).to.equal(1);
  });

  it("Should return 0 for completely disjoint token sets", () => {
    expect(tokenSimilarity("foo bar", "baz qux")).to.equal(0);
  });

  it("Should return fractional value for partial overlap", () => {
    const sim = tokenSimilarity("hello world foo", "hello world bar");
    expect(sim).to.be.greaterThan(0);
    expect(sim).to.be.lessThan(1);
  });

  it("Should handle CJK tokens", () => {
    const sim = tokenSimilarity("暴击率", "暴击率");
    expect(sim).to.equal(1);
  });

  it("Should tokenize on non-word and non-CJK characters", () => {
    const sim = tokenSimilarity("fire-rate", "fire rate");
    expect(sim).to.equal(1);
  });

  it("Should handle identical single-token strings", () => {
    expect(tokenSimilarity("test", "test")).to.equal(1);
  });

  it("Should handle strings with shared tokens", () => {
    // _ is a word character, so "critical_chance" is ONE token, not two
    const sim = tokenSimilarity("critical chance", "critical damage");
    expect(sim).to.be.greaterThan(0);
    expect(sim).to.be.lessThan(1);
  });
});
