import { IEnvVarSingleConfig } from "./IEnvVarSingleConfig";

export type IEnvVarConfig<T extends string> = {
  [P in T]: IEnvVarSingleConfig;
};
