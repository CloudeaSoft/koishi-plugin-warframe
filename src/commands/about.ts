import { inputToItemTest, inputToItemTestCases } from "../tests/wfm-tests";

export const aboutCommand = () => {
  return "Authored by CloudeaSoft.";

  return JSON.stringify(
    inputToItemTestCases.map((e) => inputToItemTest(e.a, e.b)),
    null,
    2
  );
};
