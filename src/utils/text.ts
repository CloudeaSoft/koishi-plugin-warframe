export const normalizeName = (text: string) =>
  fullWidthToHalfWidth(text)
    .toLowerCase() // 统一大小写
    .replace(/[·'\-+()【】\[\]{}，。！？；：_]/g, "") // 过滤冗余符号
    .replace(/\s+/g, ""); // 移除所有空白

export const fullWidthToHalfWidth = (text: string) =>
  text
    .replace(/[\uFF01-\uFF5E]/g, (char) => {
      // 全角字符的Unicode编码 = 半角 + 0xFEE0（除空格外）
      return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
    })
    .replace(/\u3000/g, " "); // 全角空格（U+3000）转半角空格（U+0020）

export const removeSpace = (text: string) => text.replace(/\s/g, "");

export const pascalToSpaced = (text: string) =>
  text.replace(/([A-Z])/g, " $1").trim();

export const toPascalCase = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");

export function normalSimilarity(a, b) {
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

export function tokenSimilarity(a, b) {
  const tokenize = (s) =>
    s
      .replace(/[^\w\u4e00-\u9fa5]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  const intersection = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return intersection / union;
}
