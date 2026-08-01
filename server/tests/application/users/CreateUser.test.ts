import { describe, expect, test } from "bun:test";
import { CreateUserUseCase } from "@application/users/use-cases/CreateUser";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeSecureHasher } from "../../doubles/FakeSecureHasher";
import { createAdminUser, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

const STRONG_PASSWORD = "Abcdef1!";

describe("CreateUserUseCase", () => {
  async function makeUseCase() {
    const users = new InMemoryUserRepository();
    const admin = createAdminUser();
    await users.save(admin);
    return {
      users,
      admin,
      uc: new CreateUserUseCase(users, new FakeSecureHasher(), new FakeIdGenerator("user")),
    };
  }

  test("happy path", async () => {
    const { users, admin, uc } = await makeUseCase();
    const dto = expectOk(
      await uc.execute(admin.id, { username: "newbie", password: STRONG_PASSWORD }),
    );
    expect(dto.username).toBe("newbie");
    expect(dto.isActive).toBe(true);

    const saved = await users.findByUsername("newbie");
    expect(saved?.passwordHash).toBe(`hash:${STRONG_PASSWORD}`);
  });

  test("user_not_authorized without meta manage", async () => {
    const users = new InMemoryUserRepository();
    const requester = createUser({ id: "plain-1", username: "plain" });
    await users.save(requester);
    const uc = new CreateUserUseCase(users, new FakeSecureHasher(), new FakeIdGenerator("user"));
    expectErr(
      await uc.execute(requester.id, { username: "newbie", password: STRONG_PASSWORD }),
      "user_not_authorized",
    );
  });

  test("username_too_short", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(await uc.execute(admin.id, { username: "ab", password: STRONG_PASSWORD }), "username_too_short");
  });

  test("username_too_long", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(
      await uc.execute(admin.id, { username: "a".repeat(21), password: STRONG_PASSWORD }),
      "username_too_long",
    );
  });

  test("password_too_short", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(await uc.execute(admin.id, { username: "valid", password: "Ab1!" }), "password_too_short");
  });

  test("password_too_long", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(
      await uc.execute(admin.id, { username: "valid", password: `A1!${"a".repeat(98)}` }),
      "password_too_long",
    );
  });

  test("password_weak_upper_case_letter", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(await uc.execute(admin.id, { username: "valid", password: "abcdef1!" }), "password_weak_upper_case_letter");
  });

  test("password_weak_lower_case_letter", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(await uc.execute(admin.id, { username: "valid", password: "ABCDEF1!" }), "password_weak_lower_case_letter");
  });

  test("password_weak_number", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(await uc.execute(admin.id, { username: "valid", password: "Abcdefg!" }), "password_weak_number");
  });

  test("password_weak_symbol", async () => {
    const { admin, uc } = await makeUseCase();
    expectErr(await uc.execute(admin.id, { username: "valid", password: "Abcdef12" }), "password_weak_symbol");
  });
});
