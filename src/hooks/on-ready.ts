import { wmOnReady } from "../services";

export const onReadyHandler = async () => {
  await wmOnReady();
};
