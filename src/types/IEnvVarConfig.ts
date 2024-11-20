import { IEnvVarSingleConfig } from "./IEnvVarSingleConfig";

export type IEnvVarConfig<T extends string> = Record<
  T,
  IEnvVarSingleConfig<any>
>;
