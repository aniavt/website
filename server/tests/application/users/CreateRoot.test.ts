import { describe, expect, test } from "bun:test";
import { CreateRootUseCase } from "@application/users/use-cases/CreateRoot";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeSecureHasher } from "../../doubles/FakeSecureHasher";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

const STRONG_PASSWORD = "Abcdef1!";

describe("CreateRootUseCase", () => {
  function makeUseCase(users = new InMemoryUserRepository()) {
    return new CreateRootUseCase(users, new FakeSecureHasher(), new FakeIdGenerator("root"));
  }

  test("happy path grants root permissions", async () => {
    const users = new InMemoryUserRepository();
    const uc = makeUseCase(users);
    const dto = expectOk(await uc.execute({ username: "root", password: STRONG_PASSWORD }));

    expect(dto.username).toBe("root");
    expect(dto.permissions.meta).toContain("meta.meta_manage_permissions");
    expect(dto.permissions.meta).toContain("meta.manage_user");
    expect(dto.permissions.meta).toContain("meta.manage_faq");
    expect(dto.permissions.meta).toContain("meta.manage_weekly_schedule");
    expect(dto.permissions.user).toContain("user.read_user");
    expect(dto.permissions.user).toContain("user.activate_user");
    expect(dto.permissions.user).toContain("user.deactivate_user");
    expect(dto.permissions.faq.length).toBeGreaterThan(0);
    expect(dto.permissions.weekly_schedule.length).toBeGreaterThan(0);
  });

  test("username_already_exists", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ username: "taken" }));
    const uc = makeUseCase(users);
    expectErr(await uc.execute({ username: "taken", password: STRONG_PASSWORD }), "username_already_exists");
  });

  test("username_too_short", async () => {
    const uc = makeUseCase();
    expectErr(await uc.execute({ username: "ab", password: STRONG_PASSWORD }), "username_too_short");
  });

  test("password_weak_symbol", async () => {
    const uc = makeUseCase();
    expectErr(await uc.execute({ username: "root", password: "Abcdef12" }), "password_weak_symbol");
  });
});
