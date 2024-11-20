import { IEnvVarConfig } from "./types/IEnvVarConfig";
import { bgRed, green, red, blue } from "ansi-colors";

export class EnvVarManager<T extends string> {
  private configs: IEnvVarConfig<T>;
  private cache: Partial<Record<T, any>> = {};

  constructor(configs: IEnvVarConfig<T>) {
    this.configs = configs;
  }

  getEnvVar<K extends T>(
    key: K,
  ): ReturnType<NonNullable<IEnvVarConfig<T>[K]["transform"]>> {
    if (!(key in this.cache)) {
      const config = this.configs[key];
      const rawValue = process.env[key];
      if (rawValue === undefined) {
        throw new Error(`Environment variable ${key} is not set.`);
      }
      this.cache[key] = config.transform
        ? config.transform(rawValue)
        : rawValue;
    }
    return this.cache[key];
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
        let transformErrorOccurred = false;
        let transformedValue;
        try {
          transformedValue = config.transform
            ? config.transform(rawValue)
            : rawValue;
        } catch (e) {
          transformErrorOccurred = true;
        }
        if (transformErrorOccurred) {
          results.invalid.push({
            envName: key,
            currentValueRaw: rawValue,
            reason: "Error occurred during transform fn usage!",
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
          : `${headerInvalid}\n${results.invalid.map((ri) => `\t*) ${bgRed(ri.envName)} → current value is '${red(ri.currentValueRaw)}' → ${ri.reason || "(No explanation given)"}`).join("\n")}\n`;

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
