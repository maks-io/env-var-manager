import { EnvVarManager } from "./EnvVarManager";
import { IEnvVarConfig } from "./types/IEnvVarConfig";

export function createEnvVarManager<T extends string>(configs: IEnvVarConfig<T>) {
  return new EnvVarManager<T>(configs);
}
