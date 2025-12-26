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

export const fetchAsyncImage: (
  url: string,
  method?: string
) => Promise<Blob | null> = async (
  url: string,
  method: string = "GET"
): Promise<Blob | null> => {
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
    console.log("Error: " + error.message);
    return null;
  }
};
