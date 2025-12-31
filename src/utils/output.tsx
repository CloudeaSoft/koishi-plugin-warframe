import Puppeteer from "koishi-plugin-puppeteer";
import { Element } from "koishi";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const htmlString = (() => {
  const __fileName = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__fileName);

  const stylePath = path.join(__dirname, "output.css");
  const style = readFileSync(stylePath, "utf8");
  const svgPath = path.join(__dirname, "output.svg");
  const svg = readFileSync(svgPath, "utf8");

  const template = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>{{title}}</title>
      <style>{{style}}</style>
    </head>
    <body>
      <div style="display: none;">{{svg}}</div>
      <div id="root">{{htmlString}}</div>
    </body>
  </html>`;

  return (htmlString: string, title: string = "title") => {
    return template
      .replace("{{htmlString}}", htmlString)
      .replace("{{title}}", title)
      .replace("{{style}}", style)
      .replace("{{svg}}", svg);
  };
})();

export const generateImageOutput = async (
  puppe: Puppeteer,
  element: Element
) => {
  return await puppe.render(
    htmlString(element.toString()),
    async (page, next) => {
      const handle = await page.$("#root>*");
      return await next(handle);
    }
  );
};
