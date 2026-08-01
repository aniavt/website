import { describe, expect, test } from "bun:test";
import {
  AnimePermission,
  FAQPermission,
  ManagePermission,
  UserPermission,
} from "@domain/value-object/Permissions";
import { createUser } from "../helpers/factories";

describe("UserEntity.hasPermission", () => {
  test("inactive user always false", () => {
    const user = createUser({
      isActive: false,
      grants: [{ type: "faq", permission: FAQPermission.READ_FAQ }],
    });
    expect(user.hasPermission({ type: "faq", permission: FAQPermission.READ_FAQ })).toBe(false);
  });

  test("direct permission", () => {
    const user = createUser({
      grants: [{ type: "user", permission: UserPermission.READ_USER }],
    });
    expect(user.hasPermission({ type: "user", permission: UserPermission.READ_USER })).toBe(true);
    expect(user.hasPermission({ type: "user", permission: UserPermission.ACTIVATE_USER })).toBe(false);
  });

  test("META_MANAGE_PERMISSIONS grants everything", () => {
    const user = createUser({
      grants: [{ type: "meta", permission: ManagePermission.META_MANAGE_PERMISSIONS }],
    });
    expect(user.hasPermission({ type: "faq", permission: FAQPermission.CREATE_FAQ })).toBe(true);
    expect(user.hasPermission({ type: "anime", permission: AnimePermission.DELETE_ANIME })).toBe(true);
  });

  test("meta.manage_* elevates domain", () => {
    const user = createUser({
      grants: [{ type: "meta", permission: ManagePermission.MANAGE_FAQ }],
    });
    expect(user.hasPermission({ type: "faq", permission: FAQPermission.UPDATE_FAQ })).toBe(true);
    expect(user.hasPermission({ type: "anime", permission: AnimePermission.READ_ANIME })).toBe(false);
  });
});
