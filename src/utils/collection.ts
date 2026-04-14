export const listToDict: <T>(
  dict: T[],
  predict: (obj: T) => string[],
) => Record<string, T> = <T>(
  dict: T[],
  predict: (obj: T) => string[],
): Record<string, T> => {
  const result: Record<string, T> = {};
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
  value: (obj: TObj) => TValue,
) => Record<string, TValue> = <TObj, TValue>(
  dict: TObj[],
  predict: (obj: TObj) => string[],
  value: (obj: TObj) => TValue,
): Record<string, TValue> => {
  const result: Record<string, TValue> = {};
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
  dict: Record<string, T>,
  predict: (obj: T) => string[],
) => Record<string, string> = (dict, predict) => {
  const result: Record<string, string> = {};
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
