import { describe, expect, test } from "bun:test";
import { GetUserPermissionsUseCase } from "@application/users/use-cases/GetUserPermissions";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import {
  createAdminUser,
  createUser,
  ManagePermission,
  UserPermission,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetUserPermissionsUseCase", () => {
  test("self-read returns own permissions", async () => {
    const users = new InMemoryUserRepository();
    const user = createUser({
      id: "self",
      grants: [{ type: "user", permission: UserPermission.READ_USER }],
    });
    await users.save(user);

    const uc = new GetUserPermissionsUseCase(users);
    const out = expectOk(await uc.execute({ userId: "self", requesterId: "self" }));
    expect(out.permissions.user).toContain("user.read_user");
  });

  test("other user read requires MANAGE_USER meta permission", async () => {
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "meta", permission: ManagePermission.MANAGE_USER }],
    });
    const target = createUser({
      id: "target",
      grants: [{ type: "user", permission: UserPermission.ACTIVATE_USER }],
    });
    await users.save(admin);
    await users.save(target);

    const uc = new GetUserPermissionsUseCase(users);
    const out = expectOk(await uc.execute({ userId: "target", requesterId: "admin" }));
    expect(out.permissions.user).toContain("user.activate_user");
  });

  test("user_not_found", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "self" }));
    const uc = new GetUserPermissionsUseCase(users);
    expectErr(await uc.execute({ userId: "missing", requesterId: "self" }), "user_not_found");
  });

  test("user_not_authorized when reading another user without MANAGE_USER", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "noperm" }));
    await users.save(createUser({ id: "target" }));
    const uc = new GetUserPermissionsUseCase(users);
    expectErr(
      await uc.execute({ userId: "target", requesterId: "noperm" }),
      "user_not_authorized",
    );
  });

  test("admin with META_MANAGE_PERMISSIONS can read others", async () => {
    const users = new InMemoryUserRepository();
    const admin = createAdminUser("admin");
    const target = createUser({ id: "target" });
    await users.save(admin);
    await users.save(target);

    const uc = new GetUserPermissionsUseCase(users);
    expectOk(await uc.execute({ userId: "target", requesterId: "admin" }));
  });
});
