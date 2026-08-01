import { expect } from "bun:test";
import type { Result } from "@lib/result";

export function expectOk<T, E>(result: Result<T, E>): T {
  expect(result.isSuccess()).toBe(true);
  if (!result.isSuccess()) throw new Error(`expected Ok, got Err(${String(result.error)})`);
  return result.data;
}

export function expectErr<T, E>(result: Result<T, E>, error: E): void {
  expect(result.isError()).toBe(true);
  expect(result.error).toBe(error);
}
