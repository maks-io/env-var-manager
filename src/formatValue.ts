import chalk, { ChalkInstance } from "chalk";

export const formatValue = (value: any, colorFn: ChalkInstance) => {
  return colorFn(`${value} ${chalk.greenBright(`[${typeof value}]`)}`);
};
