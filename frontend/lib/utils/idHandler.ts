import Sqids from "sqids";

const sqids = new Sqids({
  minLength: 8,
  alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
})

export const encodeId = (id: number): string => {
  return sqids.encode([id]);
}

export const decodeId = (hash: string): number | null => {
  const decoded = sqids.decode(hash);
  return decoded.length > 0 ? decoded[0] : null;
}