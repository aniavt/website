import { describe, test } from "bun:test";
import { validatePassword, validateUsername } from "@application/users/utils";
import { expectErr, expectOk } from "../helpers/result";

describe("validateUsername", () => {
  test("ok for 3–20 chars", () => {
    expectOk(validateUsername("abc"));
    expectOk(validateUsername("a".repeat(20)));
  });

  test("too short / too long", () => {
    expectErr(validateUsername("ab"), "username_too_short");
    expectErr(validateUsername("a".repeat(21)), "username_too_long");
  });
});

describe("validatePassword", () => {
  const strong = "Abcdef1!";

  test("accepts strong password", () => {
    expectOk(validatePassword(strong));
  });

  test("rejects weak passwords", () => {
    expectErr(validatePassword("Ab1!"), "password_too_short");
    expectErr(validatePassword("a".repeat(101)), "password_too_long");
    expectErr(validatePassword("abcdef1!"), "password_weak_upper_case_letter");
    expectErr(validatePassword("ABCDEF1!"), "password_weak_lower_case_letter");
    expectErr(validatePassword("Abcdefg!"), "password_weak_number");
    expectErr(validatePassword("Abcdefg1"), "password_weak_symbol");
  });
});
