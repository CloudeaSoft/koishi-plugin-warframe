export const fetchAsyncText: (
  url: string,
  method?: string
) => Promise<string | null> = async (
  url: string,
  method: string = "GET"
): Promise<string | null> => {
  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Language: "zh-hans",
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok.");
  }

  try {
    return await response.text();
  } catch (error) {
    console.log("Error: " + error.message);
    return null;
  }
};

export const fetchAsyncData: <T>(
  url: string,
  method?: string
) => Promise<T | null> = async <T = string>(
  url: string,
  method: string = "GET"
): Promise<T | null> => {
  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Language: "zh-hans",
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok.");
  }

  try {
    return await response.json();
  } catch (error) {
    console.log("Error: " + error.message);
    return null;
  }
};

export const fullWidthToHalfWidth = (str: string) => {
  return str
    .replace(/[\uFF01-\uFF5E]/g, (char) => {
      // 全角字符的Unicode编码 = 半角 + 0xFEE0（除空格外）
      return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    })
    .replace(/\u3000/g, " "); // 全角空格（U+3000）转半角空格（U+0020）
};

export const removeSpace = (text: string) => text.replace(/\s/g, "");

export const listToDict: <T>(
  dict: T[],
  predict: (obj: T) => string[]
) => { [key: string]: T } = <T>(
  dict: T[],
  predict: (obj: T) => string[]
): { [key: string]: T } => {
  const result = {};
  for (const obj of dict) {
    const keys = predict(obj);
    for (const key of keys) {
      if (typeof key === "string" && key.length > 0) {
        result[key] = obj;
      }
    }
  }
  return result;
};

export const listToDictSpec: <TObj, TValue>(
  dict: TObj[],
  predict: (obj: TObj) => string[],
  value: (obj: TObj) => TValue
) => { [key: string]: TValue } = <TObj, TValue>(
  dict: TObj[],
  predict: (obj: TObj) => string[],
  value: (obj: TObj) => TValue
): { [key: string]: TValue } => {
  const result = {};
  for (const obj of dict) {
    const keys = predict(obj);
    for (const key of keys) {
      if (typeof key === "string" && key.length > 0) {
        result[key] = value(obj);
      }
    }
  }
  return result;
};

export const dictToKeyDict: <T>(
  dict: { [key: string]: T },
  predict: (obj: T) => string[]
) => { [key: string]: string } = (dict, predict) => {
  const result = {};
  for (const obj in dict) {
    const keys = predict(dict[obj]);
    for (const key of keys) {
      if (typeof key === "string" && key.length > 0) {
        result[key] = obj;
      }
    }
  }
  return result;
};

export const pascalToSpaced = (str: string) => {
  return str.replace(/([A-Z])/g, " $1").trim();
};

export const toPascalCase = (str: string) => {
  return str
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
};
