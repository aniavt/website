import { describe, expect, test } from "bun:test";
import { ManagePermissionUseCase } from "@application/users/use-cases/ManagePermission";
import type { PermissionNamespace } from "@domain/value-object/Permissions";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import {
  createAdminUser,
  createUser,
  FAQPermission,
  ManagePermission,
  UserPermission,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("ManagePermissionUseCase", () => {
  test("grants user permission when requester has meta manage_user", async () => {
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "meta", permission: ManagePermission.MANAGE_USER }],
    });
    const target = createUser({ id: "target" });
    await users.save(admin);
    await users.save(target);

    const uc = new ManagePermissionUseCase(users);
    expectOk(
      await uc.execute({
        userId: "target",
        requesterId: "admin",
        namespace: "user",
        permission: "read_user",
        action: "grant",
      }),
    );

    const saved = await users.findById("target");
    expect(saved?.hasPermission({ type: "user", permission: UserPermission.READ_USER })).toBe(true);
  });

  test("revokes user permission", async () => {
    const users = new InMemoryUserRepository();
    const admin = createAdminUser("admin");
    const target = createUser({
      id: "target",
      grants: [{ type: "user", permission: UserPermission.READ_USER }],
    });
    await users.save(admin);
    await users.save(target);

    const uc = new ManagePermissionUseCase(users);
    expectOk(
      await uc.execute({
        userId: "target",
        requesterId: "admin",
        namespace: "user",
        permission: "read_user",
        action: "revoke",
      }),
    );

    const saved = await users.findById("target");
    expect(saved?.hasPermission({ type: "user", permission: UserPermission.READ_USER })).toBe(false);
  });

  test("permission_not_authorized without meta permission for namespace", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createUser({ id: "noperm" }));
    await users.save(createUser({ id: "target" }));

    const uc = new ManagePermissionUseCase(users);
    expectErr(
      await uc.execute({
        userId: "target",
        requesterId: "noperm",
        namespace: "faq",
        permission: "read_faq",
        action: "grant",
      }),
      "permission_not_authorized",
    );
  });

  test("user_cannot_revoke_self_meta_manage_permissions", async () => {
    const users = new InMemoryUserRepository();
    const admin = createAdminUser("admin");
    await users.save(admin);

    const uc = new ManagePermissionUseCase(users);
    expectErr(
      await uc.execute({
        userId: "admin",
        requesterId: "admin",
        namespace: "meta",
        permission: "meta_manage_permissions",
        action: "revoke",
      }),
      "user_cannot_revoke_self_meta_manage_permissions",
    );
  });

  test("permission_invalid_namespace", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createAdminUser("admin"));
    await users.save(createUser({ id: "target" }));

    const uc = new ManagePermissionUseCase(users);
    expectErr(
      await uc.execute({
        userId: "target",
        requesterId: "admin",
        namespace: "invalid" as PermissionNamespace,
        permission: "read_user",
        action: "grant",
      }),
      "permission_invalid_namespace",
    );
  });

  test("permission_invalid_slug", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createAdminUser("admin"));
    await users.save(createUser({ id: "target" }));

    const uc = new ManagePermissionUseCase(users);
    expectErr(
      await uc.execute({
        userId: "target",
        requesterId: "admin",
        namespace: "user",
        permission: "not_a_real_slug",
        action: "grant",
      }),
      "permission_invalid_slug",
    );
  });

  test("permission_invalid_action", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createAdminUser("admin"));
    await users.save(createUser({ id: "target" }));

    const uc = new ManagePermissionUseCase(users);
    expectErr(
      await uc.execute({
        userId: "target",
        requesterId: "admin",
        namespace: "user",
        permission: "read_user",
        action: "toggle" as "grant",
      }),
      "permission_invalid_action",
    );
  });

  test("user_not_found", async () => {
    const users = new InMemoryUserRepository();
    await users.save(createAdminUser("admin"));

    const uc = new ManagePermissionUseCase(users);
    expectErr(
      await uc.execute({
        userId: "missing",
        requesterId: "admin",
        namespace: "user",
        permission: "read_user",
        action: "grant",
      }),
      "user_not_found",
    );
  });

  test("grants faq permission with manage_faq meta", async () => {
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "meta", permission: ManagePermission.MANAGE_FAQ }],
    });
    const target = createUser({ id: "target" });
    await users.save(admin);
    await users.save(target);

    const uc = new ManagePermissionUseCase(users);
    expectOk(
      await uc.execute({
        userId: "target",
        requesterId: "admin",
        namespace: "faq",
        permission: "read_faq",
        action: "grant",
      }),
    );

    const saved = await users.findById("target");
    expect(saved?.hasPermission({ type: "faq", permission: FAQPermission.READ_FAQ })).toBe(true);
  });
});
