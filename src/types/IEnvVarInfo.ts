// TODO;
export interface IEnvVarInfo {
  retrieveFn: () => string;
  name: string;
  transform: (rawValue: string) => any;
  validate: (rawValue: string) => boolean;
}
