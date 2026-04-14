import { Client } from "tencentcloud-sdk-nodejs-ocr/tencentcloud/services/ocr/v20181119/ocr_client";

const ocrCache: Record<string, string[]> = {};

/**
 * Calculate the hash value of an image Base64 string
 * @param base64 Image base64 with or without prefix
 * @param algorithm Hash algorithm: SHA-256 / SHA-1 / MD5
 * @returns Hexadecimal hash string
 */
const getImageBase64Hash = async (
  base64: string,
  algorithm: AlgorithmIdentifier = "SHA-256",
): Promise<string> => {
  // 1. Remove base64 prefix (data:image/xxx;base64,)
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

  // 2. Convert Base64 to binary string
  const binaryStr = atob(pureBase64);

  // 3. Convert to Uint8Array
  const uint8Array = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    uint8Array[i] = binaryStr.charCodeAt(i);
  }

  // 4. Compute hash digest
  const hashBuffer = await crypto.subtle.digest(algorithm, uint8Array);

  // 5. Convert to hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const extractTextFromImage = async (
  image: string | Blob,
  secret: OcrAPISecret,
): Promise<string[] | undefined> => {
  if (image instanceof Blob) {
    const buffer = await image.arrayBuffer();
    image = Buffer.from(buffer).toString("base64");
  }

  const imageHash = await getImageBase64Hash(image);
  const cache = ocrCache[imageHash];
  if (cache) {
    return cache;
  }

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
  try {
    const { TextDetections } = await client.GeneralAccurateOCR({
      ImageBase64: image,
    });

    const result = TextDetections?.map((t) => t.DetectedText).filter(
      Boolean,
    ) as string[];

    if (result) {
      ocrCache[imageHash] = result;
    }

    return result;
  } catch (err) {
    console.error("error", err);
    return undefined;
  }
};
