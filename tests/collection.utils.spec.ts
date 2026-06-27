import { expect } from "chai";
import {
  listToDict,
  listToDictSpec,
  dictToKeyDict,
} from "../src/utils/collection";

describe("listToDict Tests", () => {
  it("Should build dict from list with single key", () => {
    const input = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ];
    const result = listToDict(input, (o) => [o.name]);
    expect(result["A"]).to.deep.equal({ id: 1, name: "A" });
    expect(result["B"]).to.deep.equal({ id: 2, name: "B" });
  });

  it("Should map one object to multiple dict entries", () => {
    const input = [{ id: 1, names: ["x", "y"] }];
    const result = listToDict(input, (o) => o.names);
    expect(result["x"]).to.deep.equal({ id: 1, names: ["x", "y"] });
    expect(result["y"]).to.deep.equal({ id: 1, names: ["x", "y"] });
  });

  it("Should skip empty string keys", () => {
    const input = [{ id: 1, name: "A" }];
    const result = listToDict(input, (o) => [o.name, ""]);
    expect(Object.keys(result)).to.deep.equal(["A"]);
  });

  it("Last object wins on duplicate keys", () => {
    const input = [
      { id: 1, name: "A" },
      { id: 2, name: "A" },
    ];
    const result = listToDict(input, (o) => [o.name]);
    expect(result["A"].id).to.equal(2);
  });

  it("Should return empty object for empty input", () => {
    const result = listToDict([], () => ["x"]);
    expect(result).to.deep.equal({});
  });
});

describe("listToDictSpec Tests", () => {
  it("Should build dict with value transform", () => {
    const input = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ];
    const result = listToDictSpec(input, (o) => [o.name], (o) => o.id);
    expect(result["A"]).to.equal(1);
    expect(result["B"]).to.equal(2);
  });

  it("Should support multiple keys with value transform", () => {
    const input = [{ id: 1, aliases: ["x", "y"] }];
    const result = listToDictSpec(
      input,
      (o) => o.aliases,
      (o) => o.id * 10,
    );
    expect(result["x"]).to.equal(10);
    expect(result["y"]).to.equal(10);
  });

  it("Should skip empty keys", () => {
    const input = [{ id: 1, name: "A" }];
    const result = listToDictSpec(
      input,
      (o) => [o.name, ""],
      (o) => o.id,
    );
    expect(Object.keys(result)).to.deep.equal(["A"]);
  });
});

describe("dictToKeyDict Tests", () => {
  it("Should reverse-map dict values to keys", () => {
    const input = {
      slug1: { name: "Alpha" },
      slug2: { name: "Beta" },
    };
    const result = dictToKeyDict(input, (o) => [o.name]);
    expect(result["Alpha"]).to.equal("slug1");
    expect(result["Beta"]).to.equal("slug2");
  });

  it("Should handle multiple keys per value", () => {
    const input = {
      s1: { names: ["a", "b"] },
    };
    const result = dictToKeyDict(input, (o) => o.names);
    expect(result["a"]).to.equal("s1");
    expect(result["b"]).to.equal("s1");
  });

  it("Should skip empty string keys", () => {
    const input = { s1: { name: "A" } };
    const result = dictToKeyDict(input, (o) => [o.name, ""]);
    expect(Object.keys(result)).to.deep.equal(["A"]);
  });

  it("Should return empty object for empty input", () => {
    const result = dictToKeyDict({}, () => ["x"]);
    expect(result).to.deep.equal({});
  });
});
