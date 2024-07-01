const regex = /^\d+(,\d+)*$/;

export function toNumbers(str: string): number[] {
  str = str.trim();
  if (!regex.test(str)) {
    throw new Error(`${str} is not a number array`);
  }
  return str.split(",").filter(x => x).map(n => parseInt(n, 10));
}