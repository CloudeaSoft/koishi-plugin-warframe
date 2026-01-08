import {
  analyzeRivenStat,
  getWeaponRivenDisposition,
  parseOCRResult,
} from "../src/services";

import testItem from "./assets/test-items.json";
import testAttr from "./assets/test-riven-attrs.json";
import rivenCalc from "../src/assets/rivencalc.json";

import { ExportWeapons, dict_en, dict_zh } from "warframe-public-export-plus";
import { createAsyncCache, normalizeName } from "../src/utils";
import { expect } from "chai";
import { rivenAttrValueDict } from "../src/domain/rivenBaseValues";
import {
  overrideGlobalItemData,
  globalItemDataFactory,
} from "../src/domain/wfm/globalItem";
import {
  globalRivenAttributeFactory,
  overrideGlobalRivenAttribute,
} from "../src/domain/wfm/globalRivenAttribute";

before(() => {
  overrideGlobalItemData(
    createAsyncCache(async () => {
      return await globalItemDataFactory(testItem);
    }, -1) as any
  );
  overrideGlobalRivenAttribute(
    createAsyncCache(async () => {
      return await globalRivenAttributeFactory(testAttr);
    }, -1) as any
  );
});

describe("OCR Result Tests", async function () {
  it("should extract riven stats correctly for each result", async () => {
    const results = [
      {
        Angel: 359.989990234375,
        Angle: 359.989990234375,
        Language: "zh",
        PdfPageSize: 0,
        RequestId: "8f4fad93-b2cd-4379-be6d-885541fd3731",
        TextDetections: [
          {
            AdvancedInfo: '{"Parag":{"ParagNo":1}}',
            Confidence: 100,
            DetectedText: "10",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "草原猎手Pura-",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "cronitis",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "x1.07对Infested 的伤害",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":4}}',
            Confidence: 100,
            DetectedText: "+15.8%暴击伤害",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":4}}',
            Confidence: 100,
            DetectedText: "+8.6%射速 (弓类武器效",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":5}}',
            Confidence: 100,
            DetectedText: "果加倍)",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":6}}',
            Confidence: 100,
            DetectedText: "9%武器后坐力",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":6}}',
            Confidence: 100,
            DetectedText: "段位10",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":7}}',
            Confidence: 100,
            DetectedText: "9",
            ItemPolygon: [Object],
            Polygon: [Array],
            WordCoordPoint: [],
            Words: [],
          },
        ],
      },
      {
        Angel: 359.989990234375,
        Angle: 359.989990234375,
        Language: "zh",
        PdfPageSize: 0,
        RequestId: "fb279e79-7ab7-43a8-984e-91d6df1b0c86",
        TextDetections: [
          {
            AdvancedInfo: '{"Parag":{"ParagNo":1}}',
            Confidence: 100,
            DetectedText: "盗贼Acri-hexacan",
            ItemPolygon: {
              Height: 39,
              Width: 310,
              X: 19,
              Y: 5,
            },
            Polygon: [
              {
                X: 19,
                Y: 5,
              },
              {
                X: 329,
                Y: 5,
              },
              {
                X: 329,
                Y: 44,
              },
              {
                X: 19,
                Y: 44,
              },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "+110.7%触发几率",
            ItemPolygon: {
              Height: 30,
              Width: 225,
              X: 63,
              Y: 43,
            },
            Polygon: [
              {
                X: 63,
                Y: 43,
              },
              {
                X: 288,
                Y: 43,
              },
              {
                X: 288,
                Y: 73,
              },
              {
                X: 63,
                Y: 73,
              },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "+115.7%暴击伤害",
            ItemPolygon: {
              Height: 29,
              Width: 225,
              X: 63,
              Y: 73,
            },
            Polygon: [
              {
                X: 63,
                Y: 73,
              },
              {
                X: 288,
                Y: 73,
              },
              {
                X: 288,
                Y: 102,
              },
              {
                X: 63,
                Y: 102,
              },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "+138.9% 多重射击",
            ItemPolygon: {
              Height: 28,
              Width: 226,
              X: 62,
              Y: 102,
            },
            Polygon: [
              {
                X: 62,
                Y: 102,
              },
              {
                X: 288,
                Y: 102,
              },
              {
                X: 288,
                Y: 130,
              },
              {
                X: 62,
                Y: 130,
              },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "+83.6%武器后坐力",
            ItemPolygon: {
              Height: 30,
              Width: 238,
              X: 56,
              Y: 129,
            },
            Polygon: [
              {
                X: 56,
                Y: 129,
              },
              {
                X: 294,
                Y: 129,
              },
              {
                X: 294,
                Y: 159,
              },
              {
                X: 56,
                Y: 159,
              },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "段位9",
            ItemPolygon: {
              Height: 27,
              Width: 69,
              X: 39,
              Y: 176,
            },
            Polygon: [
              {
                X: 39,
                Y: 176,
              },
              {
                X: 108,
                Y: 176,
              },
              {
                X: 108,
                Y: 203,
              },
              {
                X: 39,
                Y: 203,
              },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "12",
            ItemPolygon: {
              Height: 22,
              Width: 33,
              X: 275,
              Y: 178,
            },
            Polygon: [
              {
                X: 275,
                Y: 178,
              },
              {
                X: 308,
                Y: 178,
              },
              {
                X: 308,
                Y: 200,
              },
              {
                X: 275,
                Y: 200,
              },
            ],
            WordCoordPoint: [],
            Words: [],
          },
        ],
      },
      {
        Angel: 359.989990234375,
        Angle: 359.989990234375,
        Language: "zh",
        PdfPageSize: 0,
        RequestId: "8340738c-316e-4857-8052-925a7ef58829",
        TextDetections: [
          {
            AdvancedInfo: '{"Parag":{"ParagNo":1}}',
            Confidence: 100,
            DetectedText: "18r",
            ItemPolygon: { Height: 18, Width: 43, X: 256, Y: 65 },
            Polygon: [
              { X: 256, Y: 65 },
              { X: 299, Y: 65 },
              { X: 299, Y: 83 },
              { X: 256, Y: 83 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "伊格尼斯 Visi",
            ItemPolygon: { Height: 27, Width: 174, X: 80, Y: 214 },
            Polygon: [
              { X: 80, Y: 214 },
              { X: 254, Y: 214 },
              { X: 254, Y: 241 },
              { X: 80, Y: 241 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "saticron",
            ItemPolygon: { Height: 19, Width: 110, X: 122, Y: 246 },
            Polygon: [
              { X: 122, Y: 246 },
              { X: 232, Y: 247 },
              { X: 232, Y: 266 },
              { X: 122, Y: 264 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "+99.3%伤害",
            ItemPolygon: { Height: 20, Width: 113, X: 120, Y: 268 },
            Polygon: [
              { X: 120, Y: 268 },
              { X: 233, Y: 268 },
              { X: 233, Y: 288 },
              { X: 120, Y: 288 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "+85.2%暴击几率",
            ItemPolygon: { Height: 22, Width: 153, X: 101, Y: 287 },
            Polygon: [
              { X: 101, Y: 287 },
              { X: 254, Y: 287 },
              { X: 254, Y: 309 },
              { X: 101, Y: 309 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "+53%多重射击",
            ItemPolygon: { Height: 20, Width: 136, X: 109, Y: 309 },
            Polygon: [
              { X: 109, Y: 309 },
              { X: 245, Y: 309 },
              { X: 245, Y: 329 },
              { X: 109, Y: 329 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "-24.9% 变焦",
            ItemPolygon: { Height: 19, Width: 108, X: 124, Y: 330 },
            Polygon: [
              { X: 124, Y: 330 },
              { X: 232, Y: 330 },
              { X: 232, Y: 349 },
              { X: 124, Y: 349 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "段位 16",
            ItemPolygon: { Height: 18, Width: 63, X: 77, Y: 362 },
            Polygon: [
              { X: 77, Y: 362 },
              { X: 140, Y: 362 },
              { X: 140, Y: 380 },
              { X: 77, Y: 380 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":4}}',
            Confidence: 100,
            DetectedText: "97",
            ItemPolygon: { Height: 16, Width: 40, X: 234, Y: 364 },
            Polygon: [
              { X: 234, Y: 364 },
              { X: 274, Y: 364 },
              { X: 274, Y: 380 },
              { X: 234, Y: 380 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
        ],
      },
      {
        Angel: 359.989990234375,
        Angle: 359.989990234375,
        Language: "zh",
        PdfPageSize: 0,
        RequestId: "0e6736b1-0819-49b5-b9f6-be6c1e751f02",
        TextDetections: [
          {
            AdvancedInfo: '{"Parag":{"ParagNo":1}}',
            Confidence: 100,
            DetectedText: "A8T",
            ItemPolygon: { Height: 21, Width: 49, X: 298, Y: 45 },
            Polygon: [
              { X: 298, Y: 45 },
              { X: 249, Y: 45 },
              { X: 249, Y: 24 },
              { X: 298, Y: 24 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "宝拉Cronitis",
            ItemPolygon: { Height: 31, Width: 188, X: 61, Y: 261 },
            Polygon: [
              { X: 61, Y: 261 },
              { X: 249, Y: 261 },
              { X: 249, Y: 292 },
              { X: 61, Y: 292 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "+85% 暴击伤害",
            ItemPolygon: { Height: 25, Width: 163, X: 72, Y: 294 },
            Polygon: [
              { X: 72, Y: 294 },
              { X: 235, Y: 292 },
              { X: 236, Y: 317 },
              { X: 73, Y: 319 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "+56.9% 攻击速度",
            ItemPolygon: { Height: 25, Width: 179, X: 65, Y: 316 },
            Polygon: [
              { X: 65, Y: 316 },
              { X: 244, Y: 318 },
              { X: 243, Y: 343 },
              { X: 64, Y: 341 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "-50.9%处决伤害",
            ItemPolygon: { Height: 24, Width: 174, X: 68, Y: 343 },
            Polygon: [
              { X: 68, Y: 343 },
              { X: 242, Y: 343 },
              { X: 242, Y: 367 },
              { X: 68, Y: 367 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "段位 13",
            ItemPolygon: { Height: 22, Width: 73, X: 37, Y: 382 },
            Polygon: [
              { X: 37, Y: 382 },
              { X: 110, Y: 382 },
              { X: 110, Y: 404 },
              { X: 37, Y: 404 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "25",
            ItemPolygon: { Height: 20, Width: 48, X: 220, Y: 383 },
            Polygon: [
              { X: 220, Y: 383 },
              { X: 268, Y: 383 },
              { X: 268, Y: 403 },
              { X: 220, Y: 403 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
        ],
      },
      {
        Angel: 0,
        Angle: 0,
        RequestId: "12a0b331-f59c-4664-9b27-7f23c835a176",
        TextDetections: [
          {
            AdvancedInfo: '{"Parag":{"ParagNo":1}}',
            Confidence: 87,
            DetectedText: "18-",
            ItemPolygon: { Height: 22, Width: 52, X: 242, Y: 22 },
            Polygon: [
              { X: 243, Y: 22 },
              { X: 294, Y: 23 },
              { X: 293, Y: 44 },
              { X: 242, Y: 43 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 99,
            DetectedText: "憎恨 Crita-visidra",
            ItemPolygon: { Height: 35, Width: 257, X: 21, Y: 208 },
            Polygon: [
              { X: 21, Y: 210 },
              { X: 277, Y: 208 },
              { X: 278, Y: 241 },
              { X: 22, Y: 243 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 99,
            DetectedText: "+200.7%暴击几率(重击",
            ItemPolygon: { Height: 26, Width: 263, X: 18, Y: 244 },
            Polygon: [
              { X: 18, Y: 244 },
              { X: 281, Y: 244 },
              { X: 281, Y: 270 },
              { X: 18, Y: 270 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":4}}',
            Confidence: 100,
            DetectedText: "时x2)",
            ItemPolygon: { Height: 23, Width: 62, X: 112, Y: 269 },
            Polygon: [
              { X: 112, Y: 269 },
              { X: 174, Y: 269 },
              { X: 174, Y: 292 },
              { X: 112, Y: 292 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":5}}',
            Confidence: 100,
            DetectedText: "+52.4%攻击速度",
            ItemPolygon: { Height: 26, Width: 182, X: 59, Y: 291 },
            Polygon: [
              { X: 59, Y: 291 },
              { X: 241, Y: 291 },
              { X: 241, Y: 317 },
              { X: 59, Y: 317 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":6}}',
            Confidence: 99,
            DetectedText: "+159.4%近战伤害",
            ItemPolygon: { Height: 26, Width: 193, X: 53, Y: 316 },
            Polygon: [
              { X: 53, Y: 316 },
              { X: 246, Y: 316 },
              { X: 246, Y: 342 },
              { X: 53, Y: 342 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":7}}',
            Confidence: 99,
            DetectedText: "-101.7%切割伤害",
            ItemPolygon: { Height: 28, Width: 212, X: 43, Y: 340 },
            Polygon: [
              { X: 43, Y: 342 },
              { X: 254, Y: 340 },
              { X: 255, Y: 366 },
              { X: 44, Y: 368 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":8}}',
            Confidence: 88,
            DetectedText: "段位13",
            ItemPolygon: { Height: 22, Width: 72, X: 34, Y: 381 },
            Polygon: [
              { X: 34, Y: 381 },
              { X: 106, Y: 381 },
              { X: 106, Y: 403 },
              { X: 34, Y: 403 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":9}}',
            Confidence: 73,
            DetectedText: "09",
            ItemPolygon: { Height: 18, Width: 36, X: 227, Y: 383 },
            Polygon: [
              { X: 227, Y: 383 },
              { X: 263, Y: 383 },
              { X: 263, Y: 401 },
              { X: 227, Y: 401 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
        ],
      },
      {
        Angel: 359.989990234375,
        Angle: 359.989990234375,
        Language: "zh",
        PdfPageSize: 0,
        RequestId: "134e18ab-cbb7-4a10-805f-7116de67d1a7",
        TextDetections: [
          {
            AdvancedInfo: '{"Parag":{"ParagNo":1}}',
            Confidence: 100,
            DetectedText: "18",
            ItemPolygon: { Height: 20, Width: 50, X: 250, Y: 23 },
            Polygon: [
              { X: 250, Y: 23 },
              { X: 300, Y: 23 },
              { X: 300, Y: 43 },
              { X: 250, Y: 43 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "海波单剑Hexa-",
            ItemPolygon: { Height: 32, Width: 220, X: 46, Y: 202 },
            Polygon: [
              { X: 46, Y: 202 },
              { X: 266, Y: 205 },
              { X: 265, Y: 237 },
              { X: 45, Y: 235 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":2}}',
            Confidence: 100,
            DetectedText: "visitis",
            ItemPolygon: { Height: 26, Width: 86, X: 114, Y: 239 },
            Polygon: [
              { X: 114, Y: 239 },
              { X: 200, Y: 239 },
              { X: 200, Y: 265 },
              { X: 114, Y: 265 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "+112.3% 暴击伤害",
            ItemPolygon: { Height: 26, Width: 191, X: 61, Y: 268 },
            Polygon: [
              { X: 61, Y: 268 },
              { X: 252, Y: 268 },
              { X: 252, Y: 294 },
              { X: 61, Y: 294 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "+228.4%近战伤害",
            ItemPolygon: { Height: 24, Width: 191, X: 60, Y: 294 },
            Polygon: [
              { X: 60, Y: 294 },
              { X: 251, Y: 292 },
              { X: 252, Y: 316 },
              { X: 61, Y: 319 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "+130.8%触发几率",
            ItemPolygon: { Height: 25, Width: 192, X: 60, Y: 319 },
            Polygon: [
              { X: 60, Y: 319 },
              { X: 252, Y: 315 },
              { X: 253, Y: 340 },
              { X: 61, Y: 343 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "x0.49对Corpus的伤害",
            ItemPolygon: { Height: 26, Width: 245, X: 32, Y: 343 },
            Polygon: [
              { X: 32, Y: 343 },
              { X: 277, Y: 341 },
              { X: 278, Y: 367 },
              { X: 33, Y: 368 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":3}}',
            Confidence: 100,
            DetectedText: "段位 10",
            ItemPolygon: { Height: 22, Width: 73, X: 39, Y: 381 },
            Polygon: [
              { X: 39, Y: 381 },
              { X: 112, Y: 381 },
              { X: 112, Y: 403 },
              { X: 39, Y: 403 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
          {
            AdvancedInfo: '{"Parag":{"ParagNo":4}}',
            Confidence: 100,
            DetectedText: "69",
            ItemPolygon: { Height: 18, Width: 46, X: 224, Y: 383 },
            Polygon: [
              { X: 224, Y: 383 },
              { X: 270, Y: 383 },
              { X: 270, Y: 401 },
              { X: 224, Y: 401 },
            ],
            WordCoordPoint: [],
            Words: [],
          },
        ],
      },
    ];

    const statNum = [4, 4, 4, 3, 4, 4];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const parsed = await parseOCRResult(
        result.TextDetections.map((t) => t.DetectedText)
      );
      expect(parsed).to.not.undefined;
      expect(parsed!.attributes.length, parsed?.name).to.be.equal(statNum[i]);
      parsed!.attributes.forEach((element) => {
        expect(element.attr).to.not.undefined;
        expect(element.value).to.not.equal(0);
      });
    }
  });

  it("Transform Riven Calc Data Tests", () => {
    let count = 0;
    const mapped = rivenCalc.weapons.reduce<any[]>((prev, element) => {
      let mapped = undefined;
      for (const weaponKey in ExportWeapons) {
        const weapon = ExportWeapons[weaponKey];

        const splited = weapon.name.split("/");
        if (splited.length <= 0) {
          continue;
        }

        const keyName = splited[splited.length - 1];
        const normalizedCalcName = normalizeName(element.name);
        if (normalizeName(keyName) === normalizedCalcName) {
          count++;
          mapped = weapon;
          break;
        }

        const weaponEN = dict_en[weapon.name];
        if (weaponEN && normalizeName(weaponEN) === normalizedCalcName) {
          count++;
          mapped = weapon;
          break;
        }
      }

      if (!mapped) {
        return prev;
      }

      const weaponEN = dict_en[mapped.name];
      const weaponZH = dict_zh[mapped.name];
      const result = {
        name: {
          en: weaponEN,
          zh: weaponZH,
        },
        calc: element,
        weapon: mapped,
      };

      prev.push(result);

      return prev;
    }, []);

    // console.log(`${count}/${rivenCalc.weapons.length}`);
    // console.log(mapped.length);
    // console.log(mapped.find((e) => e.name.zh === "草原猎手"));
  });

  it("Weapon Names", () => {
    const names = [
      "MK1-盗贼",
      "悦音",
      "达克拉",
      "赤毒 食人女魔",
      "雷克斯",
      "Dex 席芭莉丝",
    ];

    for (const name of names) {
      expect(getWeaponRivenDisposition(name), name).not.be.undefined;
    }
  });
});

describe("Transform Attr Base Value Tests", function () {
  it("Attr Values", () => {
    const input = {
      name: "草原猎手",
      attributes: [
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe66",
            slug: "damage_vs_infested",
            gameRef: "WeaponFactionDamageInfested",
            group: "default",
            prefix: "Pura",
            suffix: "Ada",
            unit: "multiply",
            i18n: {
              "zh-hans": {
                name: "对Infested伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Damage to Infested",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 1.07,
          prefix: "x",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6d",
            slug: "critical_damage",
            gameRef: "WeaponCritDamageMod",
            group: "default",
            prefix: "Acri",
            suffix: "Tis",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "暴击伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Critical Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 15.8,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe72",
            slug: "fire_rate_/_attack_speed",
            gameRef: "WeaponFireRateMod",
            group: "default",
            prefix: "Croni",
            suffix: "Dra",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "射速/攻击速度",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Fire Rate / Attack Speed",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 8.6,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe7f",
            slug: "recoil",
            gameRef: "WeaponRecoilReductionMod",
            group: "default",
            prefix: "Zeti",
            suffix: "Mag",
            exclusiveTo: ["shotgun", "rifle", "pistol", "kitgun"],
            positiveIsNegative: true,
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "后坐力",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Weapon Recoil",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 9,
          prefix: "",
        },
      ],
    };

    for (const attr of input.attributes) {
      const w = getWeaponRivenDisposition(input.name);
      if (!w) {
        continue;
      }
      expect(
        !!rivenAttrValueDict[w.calc.riventype][
          normalizeName(attr.attr.i18n["en"].name)
        ]
      ).to.be.equal(true);
    }
  });

  const inputs = [
    {
      name: "草原猎手",
      attributes: [
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe66",
            slug: "damage_vs_infested",
            gameRef: "WeaponFactionDamageInfested",
            group: "default",
            prefix: "Pura",
            suffix: "Ada",
            unit: "multiply",
            i18n: {
              "zh-hans": {
                name: "对Infested伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Damage to Infested",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 1.07,
          prefix: "x",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6d",
            slug: "critical_damage",
            gameRef: "WeaponCritDamageMod",
            group: "default",
            prefix: "Acri",
            suffix: "Tis",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "暴击伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Critical Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 15.8,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe72",
            slug: "fire_rate_/_attack_speed",
            gameRef: "WeaponFireRateMod",
            group: "default",
            prefix: "Croni",
            suffix: "Dra",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "射速/攻击速度",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Fire Rate / Attack Speed",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 8.6,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe7f",
            slug: "recoil",
            gameRef: "WeaponRecoilReductionMod",
            group: "default",
            prefix: "Zeti",
            suffix: "Mag",
            exclusiveTo: ["shotgun", "rifle", "pistol", "kitgun"],
            positiveIsNegative: true,
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "后坐力",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Weapon Recoil",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 9,
          prefix: "",
        },
      ],
    },
    {
      name: "盗贼",
      attributes: [
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe7d",
            slug: "status_chance",
            gameRef: "WeaponStunChanceMod",
            group: "default",
            prefix: "Hexa",
            suffix: "Dex",
            unit: "percent",
            i18n: {
              en: {
                name: "Status Chance",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              "zh-hans": {
                name: "触发几率",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 110.7,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6d",
            slug: "critical_damage",
            gameRef: "WeaponCritDamageMod",
            group: "default",
            prefix: "Acri",
            suffix: "Tis",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "暴击伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Critical Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 115.7,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe76",
            slug: "multishot",
            gameRef: "WeaponFireIterationsMod",
            group: "default",
            prefix: "Sati",
            suffix: "Can",
            unit: "percent",
            i18n: {
              en: {
                name: "Multishot",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              "zh-hans": {
                name: "多重射击",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 138.9,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe7f",
            slug: "recoil",
            gameRef: "WeaponRecoilReductionMod",
            group: "default",
            prefix: "Zeti",
            suffix: "Mag",
            exclusiveTo: ["shotgun", "rifle", "pistol", "kitgun"],
            positiveIsNegative: true,
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "后坐力",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Weapon Recoil",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 83.6,
          prefix: "+",
        },
      ],
    },
    {
      name: "伊格尼斯",
      attributes: [
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6e",
            slug: "base_damage_/_melee_damage",
            gameRef: "WeaponDamageAmountMod",
            group: "default",
            prefix: "Visi",
            suffix: "Ata",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "基础伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 99.3,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6b",
            slug: "critical_chance",
            gameRef: "WeaponCritChanceMod",
            group: "default",
            prefix: "Crita",
            suffix: "Cron",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "暴击率",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Critical Chance",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 85.2,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe76",
            slug: "multishot",
            gameRef: "WeaponFireIterationsMod",
            group: "default",
            prefix: "Sati",
            suffix: "Can",
            unit: "percent",
            i18n: {
              en: {
                name: "Multishot",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              "zh-hans": {
                name: "多重射击",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 53,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe80",
            slug: "zoom",
            gameRef: "WeaponZoomFovMod",
            group: "default",
            prefix: "Hera",
            suffix: "Lis",
            exclusiveTo: ["shotgun", "rifle", "pistol", "kitgun"],
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "变焦",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Zoom",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: -24.9,
          prefix: "-",
        },
      ],
    },
    {
      name: "宝拉",
      attributes: [
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6d",
            slug: "critical_damage",
            gameRef: "WeaponCritDamageMod",
            group: "default",
            prefix: "Acri",
            suffix: "Tis",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "暴击伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Critical Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 85,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe72",
            slug: "fire_rate_/_attack_speed",
            gameRef: "WeaponFireRateMod",
            group: "default",
            prefix: "Croni",
            suffix: "Dra",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "射速/攻击速度",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Fire Rate / Attack Speed",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 56.9,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe71",
            slug: "finisher_damage",
            gameRef: "WeaponMeleeFinisherDamageMod",
            group: "melee",
            prefix: "Exi",
            suffix: "Cta",
            exclusiveTo: ["melee", "zaw"],
            unit: "percent",
            i18n: {
              en: {
                name: "Finisher Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              "zh-hans": {
                name: "处决伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: -50.9,
          prefix: "-",
        },
      ],
    },
    {
      name: "憎恨",
      attributes: [
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6b",
            slug: "critical_chance",
            gameRef: "WeaponCritChanceMod",
            group: "default",
            prefix: "Crita",
            suffix: "Cron",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "暴击率",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Critical Chance",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 200.7,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe72",
            slug: "fire_rate_/_attack_speed",
            gameRef: "WeaponFireRateMod",
            group: "default",
            prefix: "Croni",
            suffix: "Dra",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "射速/攻击速度",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Fire Rate / Attack Speed",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 52.4,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6e",
            slug: "base_damage_/_melee_damage",
            gameRef: "WeaponDamageAmountMod",
            group: "default",
            prefix: "Visi",
            suffix: "Ata",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "基础伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 159.4,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe7c",
            slug: "slash_damage",
            gameRef: "WeaponSlashDamageMod",
            group: "default",
            prefix: "Sci",
            suffix: "Sus",
            unit: "percent",
            i18n: {
              en: {
                name: "Slash",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              "zh-hans": {
                name: "切割伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: -101.7,
          prefix: "-",
        },
      ],
    },
    {
      name: "海波单剑",
      attributes: [
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6d",
            slug: "critical_damage",
            gameRef: "WeaponCritDamageMod",
            group: "default",
            prefix: "Acri",
            suffix: "Tis",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "暴击伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Critical Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 112.3,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe6e",
            slug: "base_damage_/_melee_damage",
            gameRef: "WeaponDamageAmountMod",
            group: "default",
            prefix: "Visi",
            suffix: "Ata",
            unit: "percent",
            i18n: {
              "zh-hans": {
                name: "基础伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Damage",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 228.4,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe7d",
            slug: "status_chance",
            gameRef: "WeaponStunChanceMod",
            group: "default",
            prefix: "Hexa",
            suffix: "Dex",
            unit: "percent",
            i18n: {
              en: {
                name: "Status Chance",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              "zh-hans": {
                name: "触发几率",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 130.8,
          prefix: "+",
        },
        {
          attr: {
            id: "5c5ca81a96e8d2003834fe64",
            slug: "damage_vs_corpus",
            gameRef: "WeaponFactionDamageCorpus",
            group: "default",
            prefix: "Manti",
            suffix: "Tron",
            unit: "multiply",
            i18n: {
              "zh-hans": {
                name: "对Corpus伤害",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
              en: {
                name: "Damage to Corpus",
                icon: "riven_attribute/unknown.png",
                thumb: "riven_attribute/unknown.thumb.png",
              },
            },
          },
          value: 0.49,
          prefix: "x",
        },
      ],
    },
  ];

  it("Attr Values Multi", () => {
    inputs.forEach((input) => {
      for (const attr of input.attributes) {
        const w = getWeaponRivenDisposition(input.name);
        if (!w) {
          continue;
        }
        const attrV =
          rivenAttrValueDict[w.calc.riventype][
            normalizeName(attr.attr.i18n["en"].name)
          ];
        expect(attrV, attr.attr.i18n["en"].name).to.be.not.undefined;
      }
    });
  });

  it("Analyze", () => {
    inputs.forEach((input) => {
      const analyzed = analyzeRivenStat(input);
      expect(analyzed).to.be.not.undefined;
    });
  });
});
