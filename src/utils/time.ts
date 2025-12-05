export const toTimeStamp = (timeStr: string): number => {
  return new Date(timeStr).getTime();
};

/**
 * 毫秒转「X小时X分钟X秒」格式（0单位不显示）
 * @param {number} ms - 待转换的毫秒数（非负）
 * @returns {string} 示例：3661000ms → "1小时1分钟1秒"；61000ms → "1分钟1秒"；500ms → "0秒"
 */
export const msToHumanReadable = (ms: number): string => {
  // 容错：处理非数字/负数，默认转为0
  const totalMs = Math.max(Number(ms) || 0, 0);
  // 转总秒数（忽略毫秒部分）
  const totalSeconds = Math.floor(totalMs / 1000);

  // 拆分小时、分钟、秒
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 定义单位映射（过滤0值）
  const parts = [];
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);
  // 秒数即使为0，也保留（避免空字符串，比如0ms显示"0秒"）
  parts.push(`${seconds}秒`);

  // 拼接结果（如果所有单位都是0，最终会是"0秒"）
  return parts.join("");
};
