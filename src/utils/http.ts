export const fetchAsyncText: (
  url: string,
  method?: string,
) => Promise<string | undefined> = async (
  url: string,
  method: string = "GET",
): Promise<string | undefined> => {
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
    if (error instanceof Error) {
      console.log(error.message);
      console.log(error.stack);
    } else {
      console.log("未知错误", error);
    }
    return undefined;
  }
};

export const fetchAsyncData: <T>(
  url: string,
  method?: string,
) => Promise<T | undefined> = async <T = string>(
  url: string,
  method: string = "GET",
): Promise<T | undefined> => {
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
    if (error instanceof Error) {
      console.log(error.message);
      console.log(error.stack);
    } else {
      console.log("未知错误", error);
    }
    return undefined;
  }
};

export const fetchAsyncImage: (
  url: string,
  method?: string,
) => Promise<Blob | undefined> = async (
  url: string,
  method: string = "GET",
): Promise<Blob | undefined> => {
  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "image/png",
      "response-type": "blob",
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok.");
  }

  try {
    return await response.blob();
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      console.log(error.stack);
    } else {
      console.log("未知错误", error);
    }
    return undefined;
  }
};
