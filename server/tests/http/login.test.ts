import { describe, expect, test } from "bun:test";
import { buildAuthTestApp } from "../helpers/buildTestApp";
import { createUser } from "../helpers/factories";

describe("POST /login (HTTP)", () => {
  test("sets httpOnly auth cookie on success", async () => {
    const { app, users } = await buildAuthTestApp();
    await users.save(createUser({ username: "alice", passwordHash: "hash:secret" }));

    const res = await app.inject({
      method: "POST",
      url: "/login",
      payload: { username: "alice", password: "secret" },
    });

    expect(res.statusCode).toBe(200);
    const setCookie = res.headers["set-cookie"];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(";") : String(setCookie ?? "");
    expect(cookieHeader).toContain("auth=");
    expect(cookieHeader.toLowerCase()).toContain("httponly");
    expect(res.json().username).toBe("alice");
    await app.close();
  });

  test("unknown user and wrong password return same 401 body (no enumeration)", async () => {
    const { app, users } = await buildAuthTestApp();
    await users.save(createUser({ username: "alice", passwordHash: "hash:secret" }));

    const missing = await app.inject({
      method: "POST",
      url: "/login",
      payload: { username: "nobody", password: "secret" },
    });
    const wrong = await app.inject({
      method: "POST",
      url: "/login",
      payload: { username: "alice", password: "wrong" },
    });

    expect(missing.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(missing.json() as { error: string }).toEqual({ error: "password_verify_failed" });
    expect(wrong.json() as { error: string }).toEqual({ error: "password_verify_failed" });
    await app.close();
  });
});
