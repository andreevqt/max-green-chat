import { describe, expect, it } from "vitest";
import { normalizePhone } from "./normalize-phone";

describe("Номера MAX", () => {
  it.each([
    ["+7 (999) 123-45-67", "79991234567"],
    ["8 999 123 45 67", "79991234567"],
    ["+375 29 123-45-67", "375291234567"],
  ])("нормализует %s", (input, expected) =>
    expect(normalizePhone(input)).toBe(expected),
  );
  it.each(["123", "+1 555 1234567", "79991234567abc", "37529123456"])(
    "отклоняет %s",
    (input) => expect(() => normalizePhone(input)).toThrow(),
  );
});
