export const toHex = (num: number | string) => {
  const val = Number(num);
  return "0x" + val.toString(16);
};

export const toUSD = (value: string) =>
  new Intl.NumberFormat("en-EN", { style: "currency", currency: "USD" }).format(Number(value));
