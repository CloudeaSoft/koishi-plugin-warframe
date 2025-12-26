import { Client } from "tencentcloud-sdk-nodejs-ocr/tencentcloud/services/ocr/v20181119/ocr_client";
import { GeneralBasicOCRResponse } from "tencentcloud-sdk-nodejs-ocr/tencentcloud/services/ocr/v20181119/ocr_models";

export const extractTextFromImage = async (
  image: string | Blob,
  secret: OcrAPISecret
): Promise<GeneralBasicOCRResponse | undefined> => {
  if (image instanceof Blob) {
    const buffer = await image.arrayBuffer();
    image = Buffer.from(buffer).toString("base64");
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
    return await client.GeneralAccurateOCR({
      ImageBase64: image,
    });
  } catch (err) {
    console.error("error", err);
    return undefined;
  }
};
