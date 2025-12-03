export const fetchAsyncData: <T>(
  url: string,
  method?: string
) => Promise<T | null> = async <T>(
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

export const toTimeStamp = (timeStr: string): number => {
  return new Date(timeStr).getTime();
};

export const fullWidthToHalfWidth = (str: string) => {
  return str
    .replace(/[\uFF01-\uFF5E]/g, (char) => {
      // 全角字符的Unicode编码 = 半角 + 0xFEE0（除空格外）
      return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    })
    .replace(/\u3000/g, " "); // 全角空格（U+3000）转半角空格（U+0020）
};
