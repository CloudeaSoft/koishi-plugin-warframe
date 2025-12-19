import { wfOnReady, wmOnReady } from "../services";

export const onReadyHandler = async () => {
  await wmOnReady();
  await wfOnReady();
};
