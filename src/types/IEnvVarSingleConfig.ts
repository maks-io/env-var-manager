import { ITransformFn } from "./ITransformFn";
import { IValidateFn } from "./IValidateFn";

export type IEnvVarSingleConfig = {
  retrieve: () => string | undefined;
  transform: ITransformFn<any>;
  validate?: IValidateFn<any>;
  invalidValueErrorMsg?: string;
};
