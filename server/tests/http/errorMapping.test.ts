import { describe, expect, test } from "bun:test";
import { mapErrorToHttpCode } from "@infrastructure/http/fastify/errors";
import { buildAuthTestApp } from "../helpers/buildTestApp";

describe("sendDomainError / user error mapping", () => {
  test("mapErrorToHttpCode: unauthorized 403 vs password_verify 401", () => {
    const status: Partial<Record<string, number>> = {
      user_not_authorized: 403,
      password_verify_failed: 401,
    };
    expect(mapErrorToHttpCode("user_not_authorized", status)).toBe(403);
    expect(mapErrorToHttpCode("password_verify_failed", status)).toBe(401);
  });

  test("HTTP smoke: 403 vs 401 via sendUserError", async () => {
    const { app } = await buildAuthTestApp();

    const forbidden = await app.inject({ method: "GET", url: "/__test/error/user_not_authorized" });
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.json() as { error: string }).toEqual({ error: "user_not_authorized" });

    const unauthorized = await app.inject({
      method: "GET",
      url: "/__test/error/password_verify_failed",
    });
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.json() as { error: string }).toEqual({ error: "password_verify_failed" });

    await app.close();
  });

  test("Zod validation errors unify to { error: invalid_input }", async () => {
    const { app } = await buildAuthTestApp();

    const res = await app.inject({
      method: "POST",
      url: "/login",
      payload: { username: 1 },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json() as { error: string }).toEqual({ error: "invalid_input" });

    await app.close();
  });
});
