// 颜色插值函数
export function lerp(start: number, end: number, t: number) {
  return Math.round(start + (end - start) * t)
}

// 将十六进制颜色转换为RGB
export function hexToRgb(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

// 将RGB转换为十六进制
export function rgbToHex(r: number, g: number, b: number) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
