import { getRegionTime as getEnvironment } from "../../services";

export const environmentCommand = async () => {
  return await getEnvironment();
};
