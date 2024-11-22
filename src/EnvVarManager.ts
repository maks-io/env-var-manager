import { IEnvVarConfig } from "./types/IEnvVarConfig";
import { bgRed, blue, cyan, green, red } from "ansi-colors";
import { formatValue } from "./formatValue";

export class EnvVarManager<T extends string, C extends IEnvVarConfig<T>> {
  private configs: C;
  private cache: Partial<Record<T, any>> = {};

  constructor(configs: C) {
    this.configs = configs;
  }

  getEnvVar<K extends T>(
    envVarName: K,
    throwError = true,
  ): ReturnType<C[K]["transform"]> {
    if (!(envVarName in this.cache)) {
      const config = this.configs[envVarName];
      const rawValue = config.retrieve();
      if (rawValue === undefined) {
        throw new Error(`Environment variable '${envVarName}' is not set.`);
      }
      let transformError = "";
      let transformedValue;
      try {
        transformedValue = config.transform
          ? config.transform(rawValue)
          : rawValue;
      } catch (e) {
        transformError = e.message;
      }
      if (transformError && throwError) {
        throw new Error(
          `Environment variable '${envVarName}' failed to transform. Error was: ${transformError}`,
        );
      }
      this.cache[envVarName] = transformError
        ? `Error occurred during transform fn usage: ${transformError}`
        : transformedValue;
    }
    return this.cache[envVarName];
  }

  validateAll(
    throwError = true,
    reportSuccess = true,
  ): {
    valid: T[];
    invalid: { envName: string; reason: string }[];
    missing: T[];
  } {
    const reportHeader = blue(`///// Environment Variable Validation /////\n`);
    const reportFooter = blue(`\n///////////////////////////////////////////`);

    const results = {
      valid: [] as T[],
      invalid: [] as {
        envName: string;
        currentValueRaw: string | undefined;
        currentValueTransformed?: T;
        reason: string;
        transformError?: string;
      }[],
      missing: [] as T[],
    };

    for (const key of Object.keys(this.configs) as T[]) {
      const config = this.configs[key];
      const rawValue = config.retrieve();
      if (rawValue === undefined) {
        results.missing.push(key);
      } else {
        const config = this.configs[key];
        let transformError = "";
        let transformedValue;
        try {
          transformedValue = config.transform
            ? config.transform(rawValue)
            : rawValue;
        } catch (e) {
          transformError = e.message;
        }
        if (transformError) {
          results.invalid.push({
            envName: key,
            currentValueRaw: rawValue,
            reason: `Error occurred during transform fn usage`,
            transformError,
          });
        } else if (config.validate) {
          const isValid = config.validate(transformedValue);
          if (isValid) {
            results.valid.push(key);
          } else {
            results.invalid.push({
              envName: key,
              currentValueRaw: rawValue,
              currentValueTransformed: transformedValue,
              reason: config.invalidValueErrorMsg ?? "",
            });
          }
        } else {
          results.valid.push(key);
        }
      }
    }

    const nrOfValid = results.valid.length;
    const nrOfInvalid = results.invalid.length;
    const nrOfMissing = results.missing.length;
    const nrTotal = nrOfValid + nrOfInvalid + nrOfMissing;

    if (throwError && (nrOfMissing > 0 || nrOfInvalid > 0)) {
      const headerMissing = red(
        `${nrOfMissing} of ${nrTotal} environment variable(s) are missing:`,
      );
      const errorMsgMissing =
        nrOfMissing === 0
          ? ""
          : `${headerMissing}\n${results.missing.map((rm) => `\t*) ${bgRed(rm)}`).join("\n")}\n`;

      const headerInvalid = red(
        `${nrOfInvalid} of ${nrTotal} environment variable(s) are invalid:`,
      );

      const errorMsgInvalid =
        nrOfInvalid === 0
          ? ""
          : `${headerInvalid}\n${results.invalid
              .map((ri) => {
                const { transformError } = ri;
                const rawAndTransformedDiffer =
                  ri.currentValueRaw !== ri.currentValueTransformed;

                const noExplanationGiven =
                  "(No explanation given why it is invalid, check validate function!)";

                const explanation = transformError
                  ? `current raw value is ${formatValue(ri.currentValueRaw, red)}\n\t   → ${ri.reason}:\n\t     ${ri.transformError}`
                  : !rawAndTransformedDiffer
                    ? `current value is ${formatValue(ri.currentValueRaw, red)}\n\t   → ${ri.reason || noExplanationGiven}`
                    : `current raw value is ${formatValue(ri.currentValueRaw, cyan)}, current transformed value is ${formatValue(ri.currentValueTransformed, red)}\n\t   → ${ri.reason || noExplanationGiven}`;

                return `\t*) ${bgRed(ri.envName)}\n\t   → ${explanation}`;
              })
              .join("\n")}\n`;

      const validMsg = green(
        `${nrOfValid} of ${nrTotal} environment variable(s) are ok.`,
      );

      const errorMsg = `\n${reportHeader}${errorMsgMissing}${errorMsgInvalid}${validMsg}${reportFooter}`;
      throw new Error(errorMsg);
    }

    if (reportSuccess && (nrOfMissing === 0 || nrOfInvalid === 0)) {
      const validMsg = green(
        `${nrOfValid} of ${nrTotal} environment variable(s) are ok.`,
      );
      console.log(`${reportHeader}${validMsg}${reportFooter}`);
    }

    return results;
  }
}
