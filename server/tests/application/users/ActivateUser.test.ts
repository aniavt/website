import { describe, expect, test } from "bun:test";
import { ActivateUserUseCase } from "@application/users/use-cases/ActivateUser";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { createAdminUser, createUser, UserPermission } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("ActivateUserUseCase", () => {
  test("activates inactive user when requester has permission", async () => {
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "user", permission: UserPermission.ACTIVATE_USER }],
    });
    const target = createUser({ id: "target", isActive: false });
    await users.save(admin);
    await users.save(target);

    const uc = new ActivateUserUseCase(users);
    expectOk(await uc.execute("target", "admin"));

    const saved = await users.findById("target");
    expect(saved?.isActive).toBe(true);
  });

  test("already active user is a no-op", async () => {
    const users = new InMemoryUserRepository();
    const admin = createAdminUser("admin");
    const target = createUser({ id: "target", isActive: true });
    await users.save(admin);
    await users.save(target);

    const uc = new ActivateUserUseCase(users);
    expectOk(await uc.execute("target", "admin"));
  });

  test("user_not_found", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createAdminUser("admin"));
    const uc = new ActivateUserUseCase(users);
    expectErr(await uc.execute("missing", "admin"), "user_not_found");
  });

  test("user_not_authorized without ACTIVATE_USER", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "noperm" }));
    await users.save(createUser({ id: "target", isActive: false }));
    const uc = new ActivateUserUseCase(users);
    expectErr(await uc.execute("target", "noperm"), "user_not_authorized");
  });
});
