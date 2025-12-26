// 颜色插值函数
export const lerp = (start: number, end: number, t: number) =>
  Math.round(start + (end - start) * t);

// 将十六进制颜色转换为RGB
export const hexToRgb = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

// 将RGB转换为十六进制
export const rgbToHex = (r: number, g: number, b: number) =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
