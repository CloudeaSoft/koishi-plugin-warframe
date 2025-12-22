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
