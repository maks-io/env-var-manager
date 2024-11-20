export type IEnvVarSingleConfig<T> = {
  retrieve: () => string | undefined;
  validate?: (value: T) => boolean;
  transform?: (rawValue: string) => T;
  invalidValueErrorMsg?: string;
};
