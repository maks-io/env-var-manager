import { ITransformFn } from "./ITransformFn";
import { IValidateFn } from "./IValidateFn";

export type IEnvVarSingleConfig = {
  retrieve: () => string | undefined;
  validate?: IValidateFn<any>;
  transform?: ITransformFn<any>;
  invalidValueErrorMsg?: string;
};
