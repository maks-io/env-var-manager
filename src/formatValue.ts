import { greenBright, StyleFunction } from "ansi-colors";

export const formatValue = (value: any, colorFn: StyleFunction) => {
  return colorFn(`${value} ${greenBright(`[${typeof value}]`)}`);
};
