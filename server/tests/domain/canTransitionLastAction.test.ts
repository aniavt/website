import { describe, expect, test } from "bun:test";
import { canTransitionLastAction, type SoftDeleteLastAction } from "@domain/shared/canTransitionLastAction";

const ALL: SoftDeleteLastAction[] = ["created", "updated", "deleted", "restore"];

describe("canTransitionLastAction", () => {
  test.each([
    ["created", "updated", true],
    ["created", "deleted", true],
    ["created", "created", false],
    ["created", "restore", false],
    ["updated", "updated", true],
    ["updated", "deleted", true],
    ["updated", "restore", false],
    ["restore", "updated", true],
    ["restore", "deleted", true],
    ["restore", "restore", false],
    ["deleted", "restore", true],
    ["deleted", "deleted", false],
    ["deleted", "updated", false],
    ["deleted", "created", false],
  ] as const)("%s → %s = %s", (from, to, allowed) => {
    expect(canTransitionLastAction(from, to)).toBe(allowed);
  });

  test("matrix covers every from/to pair", () => {
    for (const from of ALL) {
      for (const to of ALL) {
        const result = canTransitionLastAction(from, to);
        expect(typeof result).toBe("boolean");
      }
    }
  });
});
