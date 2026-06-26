import crypto from "node:crypto";
import { Client } from "tencentcloud-sdk-nodejs-ocr/tencentcloud/services/ocr/v20181119/ocr_client";
import { CacheStorage } from "../utils";

const ocrCache = new CacheStorage<string[]>(100);

/**
 * Calculate the hash value of an image Base64 string
 * @param base64 Image base64 with or without prefix
 * @param algorithm Hash algorithm: SHA-256 / SHA-1 / MD5
 * @returns Hexadecimal hash string
 */
const getImageBase64Hash = (base64: string): string => {
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  return crypto.createHash("sha256").update(pureBase64, "base64").digest("hex");
};

const getTextFromTencentOCR = async (image: string, secret: OcrAPISecret) => {
  const tencentcloud = require("tencentcloud-sdk-nodejs-ocr");
  const ocrClient = tencentcloud.ocr.v20181119.Client;
  const clientConfig = {
    credential: {
      secretId: secret.id,
      secretKey: secret.key,
    },
    region: "",
    profile: {
      httpProfile: {
        endpoint: "ocr.tencentcloudapi.com",
      },
    },
  };

  const client = new ocrClient(clientConfig) as Client;

  const { TextDetections } = await client.GeneralAccurateOCR({
    ImageBase64: image,
  });

  const result = TextDetections?.map((t) => t.DetectedText).filter(
    Boolean,
  ) as string[];

  return result;
};

export const extractTextFromImage = async (
  image: string | Blob,
  secret: OcrAPISecret,
): Promise<string[] | undefined> => {
  if (image instanceof Blob) {
    const buffer = await image.arrayBuffer();
    image = Buffer.from(buffer).toString("base64");
  }

  const imageHash = getImageBase64Hash(image);

  try {
    return await ocrCache.get(imageHash, () =>
      getTextFromTencentOCR(image, secret),
    );
  } catch (err) {
    console.error("Ocr request error!", err);
    return undefined;
  }
};
