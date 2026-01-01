import { expect } from "chai";
import { removeSpace, toPascalCase } from "../src/utils/text";

describe("removeSpace Tests", function () {
  // ---------------------------------------------------------
  // 1. Basic behavior
  // ---------------------------------------------------------
  it("Should remove all spaces between CJK characters", () => {
    const cases = [
      ["测 试", "测试"],
      ["中 文", "中文"],
      ["伤 害 值", "伤害值"],
    ];

    cases.forEach(([input, expected]) => {
      expect(removeSpace(input)).equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 2. Should remove all spaces, even if only spaces
  // ---------------------------------------------------------
  it("Should return empty string when input is only spaces", () => {
    const cases = [
      [" ", ""],
      ["     ", ""],
      ["\t \t", ""], // tabs + spaces
    ];

    cases.forEach(([input, expected]) => {
      expect(removeSpace(input)).equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 3. Mixed English + CJK
  // ---------------------------------------------------------
  it("Should remove spaces but keep English/CJK characters intact", () => {
    const cases = [
      ["A B C", "ABC"],
      ["武 器 recoil", "武器recoil"],
      ["crit 率", "crit率"],
      ["增 加 fire Rate", "增加fireRate"],
    ];

    cases.forEach(([input, expected]) => {
      expect(removeSpace(input)).equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 4. OCR noise: random spacing, multiple spaces, leading/trailing
  // ---------------------------------------------------------
  it("Should remove irregular OCR spacing", () => {
    const cases = [
      ["  测 试  ", "测试"],
      ["对  infested  的  伤害", "对infested的伤害"],
      ["武器   recoil   减少", "武器recoil减少"],
      ["++  火 焰  ++", "++火焰++"],
    ];

    cases.forEach(([input, expected]) => {
      expect(removeSpace(input)).equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 5. Emoji + symbols + CJK
  // ---------------------------------------------------------
  it("Should remove spaces around emoji and symbols", () => {
    const cases = [
      ["🔥 火 焰", "🔥火焰"],
      ["💥 爆 炸", "💥爆炸"],
      ["伤 害 💀 值", "伤害💀值"],
      ["😀 测 试 😀", "😀测试😀"],
    ];

    cases.forEach(([input, expected]) => {
      expect(removeSpace(input)).equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 6. Stress tests
  // ---------------------------------------------------------
  it("Should handle long strings with scattered spaces", () => {
    const cases = [
      [
        "对  infested 的 伤 害 并 增 加 critical Chance",
        "对infested的伤害并增加criticalChance",
      ],
      [
        "测 试 文 本 fire Rate reload Speed 混 合",
        "测试文本fireRatereloadSpeed混合",
      ],
    ];

    cases.forEach(([input, expected]) => {
      expect(removeSpace(input)).equal(expected);
    });
  });
});

describe("Pascal Case Convert Tests", function () {
  // ---------------------------------------------------------
  // 1. Non‑English text should remain untouched
  // ---------------------------------------------------------
  it("Should leave pure non‑English text unchanged", () => {
    const cases = [
      ["伤害", "伤害"],
      ["暴击率", "暴击率"],
      ["测试中文", "测试中文"],
      ["日本語テスト", "日本語テスト"],
      ["한국어테스트", "한국어테스트"],
      ["русскийТекст", "русскийТекст"],
      ["+105%伤害", "+105%伤害"],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 2. English words mixed with CJK
  // ---------------------------------------------------------
  it("Should PascalCase English segments inside CJK text", () => {
    const cases = [
      ["hello世界", "Hello世界"],
      ["foo_bar_测试", "Foo_Bar_测试"],
      ["对infested的伤害", "对Infested的伤害"],
      ["武器recoil减少", "武器Recoil减少"],
      ["增加criticalChance概率", "增加Criticalchance概率"],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 3. Multiple English segments in one string
  // ---------------------------------------------------------
  it("Should PascalCase multiple English segments independently", () => {
    const cases = [
      ["fire_rate_and_damage", "Fire_Rate_And_Damage"],
      ["hello_world_test中文", "Hello_World_Test中文"],
      ["中文fooBarBaz测试", "中文Foobarbaz测试"],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 4. OCR noise: mixed punctuation, symbols, spacing
  // ---------------------------------------------------------
  it("Should handle OCR noise and preserve symbols", () => {
    const cases = [
      ["  recoil   减少  ", "  Recoil   减少  "],
      ["damage--测试", "Damage--测试"],
      ["crit%率", "Crit%率"],
      ["+++fire+++火焰", "+++Fire+++火焰"],
      ["(cold)冰冻", "(Cold)冰冻"],
      ["毒+toxin+伤害", "毒+Toxin+伤害"],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 5. Numbers mixed with English
  // ---------------------------------------------------------
  it("Should PascalCase alphanumeric English segments", () => {
    const cases = [
      ["mod123测试", "Mod123测试"],
      ["123abc测试", "123abc测试"], // starts with number → no uppercase change
      ["abc123中文", "Abc123中文"],
      ["冷却cd45减少", "冷却Cd45减少"],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 6. Emoji + English + CJK
  // ---------------------------------------------------------
  it("Should preserve emoji and only PascalCase English", () => {
    const cases = [
      ["🔥fire伤害", "🔥Fire伤害"],
      ["测试boost💥爆炸", "测试Boost💥爆炸"],
      ["💀crit率", "💀Crit率"],
      ["emoji😀test测试", "Emoji😀Test测试"],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 7. Already PascalCase or uppercase English
  // ---------------------------------------------------------
  it("Should normalize English segments even if uppercase or mixed", () => {
    const cases = [
      ["CRIT伤害", "Crit伤害"],
      ["ReCoIl减少", "Recoil减少"],
      ["DAMAGE测试", "Damage测试"],
      ["HELLO世界", "Hello世界"],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });

  // ---------------------------------------------------------
  // 8. Long strings & stress tests
  // ---------------------------------------------------------
  it("Should handle long mixed-language strings", () => {
    const cases = [
      [
        "对infested的伤害并增加criticalChance和fireRate以及reloadSpeed减少",
        "对Infested的伤害并增加Criticalchance和Firerate以及Reloadspeed减少",
      ],
      [
        "测试foo_bar_baz与recoil_damage_fireRate混合文本",
        "测试Foo_Bar_Baz与Recoil_Damage_Firerate混合文本",
      ],
    ];

    cases.forEach(([input, expected]) => {
      expect(toPascalCase(input)).to.equal(expected);
    });
  });
});
