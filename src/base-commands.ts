export const aboutCommand = () => {
  return "Authored by CloudeaSoft.";
};

export const timeCommand = (_: never, region?: string) => {
  return `当前${region ?? ""}时间: ${new Date().toLocaleString()}`;
};
