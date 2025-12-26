import { Argv, Dict } from "koishi";
import { generateAnalyzedRivenOutput, getAnalyzedRiven } from "../../services";

// input example
// {
//   src: 'https://multimedia.nt.qq.com.cn/download?appid=1407&fileid=EhSbiKlNhenZ15S4s8g3fKbWnigO_xiq1zQg_woo_ITZ2cPTkQMyBHByb2RQgL2jAVoQYr6GFTzpYU9ru9vH3KRquXoCnkGCAQJuag&rkey=CAISONPsN0nSR8aLvM1wiFc17l9Vp25vzGKOI3P88HGlfq2gum-kDb4TI0oJR8m_2-p4vB6cudJCb-C-&spec=0'
// }

export const rivenCommand = async (
  action: Argv,
  input: Dict,
  secret: OcrAPISecret
) => {
  const result = await getAnalyzedRiven(secret, input);
  if (typeof result === "string") {
    return result;
  }

  return await generateAnalyzedRivenOutput(
    action.session.app.puppeteer,
    result
  );
};
