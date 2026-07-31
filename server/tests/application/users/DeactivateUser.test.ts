import { describe, expect, test } from "bun:test";
import { DeactivateUserUseCase } from "@application/users/use-cases/DeactivateUser";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import {
  createAdminUser,
  createUser,
  ManagePermission,
  UserPermission,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("DeactivateUserUseCase", () => {
  test("self-deactivate without DEACTIVATE_USER permission", async () => {
    const users = new InMemoryUserRepository();
    const user = createUser({ id: "self" });
    await users.save(user);

    const uc = new DeactivateUserUseCase(users);
    expectOk(await uc.execute("self", "self"));

    const saved = await users.findById("self");
    expect(saved?.isActive).toBe(false);
  });

  test("deactivates another user with DEACTIVATE_USER permission", async () => {
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "user", permission: UserPermission.DEACTIVATE_USER }],
    });
    const target = createUser({ id: "target" });
    await users.save(admin);
    await users.save(target);

    const uc = new DeactivateUserUseCase(users);
    expectOk(await uc.execute("target", "admin"));

    const saved = await users.findById("target");
    expect(saved?.isActive).toBe(false);
  });

  test("already inactive user is a no-op", async () => {
    const users = new InMemoryUserRepository();
    const user = createUser({ id: "self", isActive: false });
    await users.save(user);

    const uc = new DeactivateUserUseCase(users);
    expectOk(await uc.execute("self", "self"));
  });

  test("user_not_found", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "self" }));
    const uc = new DeactivateUserUseCase(users);
    expectErr(await uc.execute("missing", "self"), "user_not_found");
  });

  test("user_not_authorized when deactivating another without permission", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "noperm" }));
    await users.save(createUser({ id: "target" }));
    const uc = new DeactivateUserUseCase(users);
    expectErr(await uc.execute("target", "noperm"), "user_not_authorized");
  });

  test("user_cannot_deactivate_root with META_MANAGE_PERMISSIONS", async () => {
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "user", permission: UserPermission.DEACTIVATE_USER }],
    });
    const root = createAdminUser("root");
    await users.save(admin);
    await users.save(root);

    const uc = new DeactivateUserUseCase(users);
    expectErr(await uc.execute("root", "admin"), "user_cannot_deactivate_root");
  });

  test("user_cannot_deactivate_root with MANAGE_USER meta", async () => {
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "user", permission: UserPermission.DEACTIVATE_USER }],
    });
    const root = createUser({
      id: "root",
      grants: [{ type: "meta", permission: ManagePermission.MANAGE_USER }],
    });
    await users.save(admin);
    await users.save(root);

    const uc = new DeactivateUserUseCase(users);
    expectErr(await uc.execute("root", "admin"), "user_cannot_deactivate_root");
  });
});
