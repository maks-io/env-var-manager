import { EnvVarManager } from "./EnvVarManager";
import { IEnvVarConfig } from "./types/IEnvVarConfig";

export function createEnvVarManager<
  T extends string,
  C extends IEnvVarConfig<T>,
>(configs: C) {
  return new EnvVarManager<T, C>(configs);
}
