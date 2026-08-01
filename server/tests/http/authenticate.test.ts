import { describe, expect, test } from "bun:test";
import jsonwebtoken from "jsonwebtoken";
import type { FastifyRequest } from "fastify";
import { getUserFromRequest } from "@infrastructure/http/fastify/middlewares/auth";
import { jwt } from "@infrastructure/http/fastify/config";
import { InMemoryUserRepository } from "../doubles/InMemoryUserRepository";
import { buildAuthTestApp } from "../helpers/buildTestApp";
import { createUser } from "../helpers/factories";
import { expectErr, expectOk } from "../helpers/result";

function signCookie(userId: string, version: number): string {
  return jsonwebtoken.sign({ userId, version }, jwt.secret, { expiresIn: "1h" });
}

function fakeRequest(authCookie?: string): FastifyRequest {
  return { cookies: authCookie ? { auth: authCookie } : {} } as FastifyRequest;
}

describe("getUserFromRequest (auth middleware core)", () => {
  test("missing cookie → token_not_found", async () => {
    const users = new InMemoryUserRepository();
    expectErr(await getUserFromRequest(fakeRequest(), users), "token_not_found");
  });

  test("invalid token → token_verification_failed", async () => {
    const users = new InMemoryUserRepository();
    expectErr(
      await getUserFromRequest(fakeRequest("not-a-jwt"), users),
      "token_verification_failed",
    );
  });

  test("inactive user → user_not_found", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "u1", isActive: false, sessionVersion: 0 }));
    expectErr(
      await getUserFromRequest(fakeRequest(signCookie("u1", 0)), users),
      "user_not_found",
    );
  });

  test("sessionVersion mismatch → token_revoked", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "u1", sessionVersion: 2 }));
    expectErr(
      await getUserFromRequest(fakeRequest(signCookie("u1", 0)), users),
      "token_revoked",
    );
  });

  test("valid token → user entity", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "u1", username: "alice", sessionVersion: 0 }));
    const user = expectOk(await getUserFromRequest(fakeRequest(signCookie("u1", 0)), users));
    expect(user.username).toBe("alice");
  });
});

describe("authenticate middleware (HTTP)", () => {
  test("valid cookie → 200 /me", async () => {
    const { app, users } = await buildAuthTestApp();
    await users.save(createUser({ id: "u1", username: "alice", sessionVersion: 0 }));
    const res = await app.inject({
      method: "GET",
      url: "/me",
      cookies: { auth: signCookie("u1", 0) },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().username).toBe("alice");
    await app.close();
  });

  test("missing cookie → 401 over real listen (inject races with preHandler send)", async () => {
    const { app } = await buildAuthTestApp();
    await app.listen({ port: 0, host: "127.0.0.1" });
    const addr = app.server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const res = await fetch(`http://127.0.0.1:${port}/me`);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "token_not_found" });
    await app.close();
  });
});
