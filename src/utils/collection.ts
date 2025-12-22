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
