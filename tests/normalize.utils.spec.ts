import { expect } from "chai";
import {
  normalizeName,
  fullWidthToHalfWidth,
  pascalToSpaced,
} from "../src/utils/text";

describe("normalizeName Tests", () => {
  it("Should convert to lowercase", () => {
    expect(normalizeName("HELLO")).to.equal("hello");
    expect(normalizeName("MixedCase")).to.equal("mixedcase");
  });

  it("Should remove all whitespace", () => {
    expect(normalizeName("hello world")).to.equal("helloworld");
    expect(normalizeName("  a b c  ")).to.equal("abc");
    expect(normalizeName("a\tb\n c")).to.equal("abc");
  });

  it("Should strip redundant symbols", () => {
    expect(normalizeName("test's")).to.equal("tests");
    expect(normalizeName("a-b+c")).to.equal("abc");
    expect(normalizeName("(test)")).to.equal("test");
    expect(normalizeName("[test]")).to.equal("test");
    expect(normalizeName("{test}")).to.equal("test");
    expect(normalizeName("【test】")).to.equal("test");
    // full-width 。 is NOT in the full-width-to-halfwidth range, so regex strips it
    expect(normalizeName("test。test")).to.equal("testtest");
    // full-width ！？；： ARE in the full-width range, get converted to half-width !?;: before regex runs
    expect(normalizeName("test！？；：")).to.equal("test!?;:");
  });

  it("Should convert full-width characters to half-width", () => {
    expect(normalizeName("ＡＢＣ")).to.equal("abc");
    expect(normalizeName("１２３")).to.equal("123");
  });

  it("Should handle mixed full-width, symbols, and spaces", () => {
    expect(normalizeName(" Ａ-Ｂ ")).to.equal("ab");
  });

  it("Should handle empty string", () => {
    expect(normalizeName("")).to.equal("");
  });

  it("Should preserve CJK characters", () => {
    expect(normalizeName("古纪A1")).to.equal("古纪a1");
  });

  it("Should remove middle dot (·)", () => {
    expect(normalizeName("a·b")).to.equal("ab");
  });
});

describe("fullWidthToHalfWidth Tests", () => {
  it("Should convert full-width uppercase letters", () => {
    expect(fullWidthToHalfWidth("ＡＢＣＤＥ")).to.equal("ABCDE");
  });

  it("Should convert full-width lowercase letters", () => {
    expect(fullWidthToHalfWidth("ａｂｃｄｅ")).to.equal("abcde");
  });

  it("Should convert full-width digits", () => {
    expect(fullWidthToHalfWidth("０１２３４５６７８９")).to.equal(
      "0123456789",
    );
  });

  it("Should convert full-width space to half-width space", () => {
    expect(fullWidthToHalfWidth("a\u3000b")).to.equal("a b");
  });

  it("Should leave ASCII characters unchanged", () => {
    expect(fullWidthToHalfWidth("hello123")).to.equal("hello123");
  });

  it("Should leave CJK characters unchanged", () => {
    expect(fullWidthToHalfWidth("中文测试")).to.equal("中文测试");
  });

  it("Should handle mixed content", () => {
    expect(fullWidthToHalfWidth("Ａ中ｂ文１２３")).to.equal("A中b文123");
  });
});

describe("pascalToSpaced Tests", () => {
  it("Should insert space before each uppercase letter", () => {
    expect(pascalToSpaced("HelloWorld")).to.equal("Hello World");
  });

  it("Should trim leading space", () => {
    expect(pascalToSpaced("Hello")).to.equal("Hello");
  });

  it("Should handle consecutive capitals", () => {
    expect(pascalToSpaced("XMLParser")).to.equal("X M L Parser");
  });

  it("Should leave lowercase-only strings unchanged", () => {
    expect(pascalToSpaced("hello")).to.equal("hello");
  });

  it("Should handle empty string", () => {
    expect(pascalToSpaced("")).to.equal("");
  });

  it("Should handle single character", () => {
    expect(pascalToSpaced("A")).to.equal("A");
  });
});
