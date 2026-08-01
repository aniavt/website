import { describe, test } from "bun:test";
import { assertPermission } from "@application/shared/auth";
import { FAQPermission } from "@domain/value-object/Permissions";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("assertPermission", () => {
  test("unauthorized when requester missing", async () => {
    const users = new InMemoryUserRepository();
    const result = await assertPermission(
      users,
      "missing",
      { type: "faq", permission: FAQPermission.READ_FAQ },
      "faq_not_authorized",
    );
    expectErr(result, "faq_not_authorized");
  });

  test("unauthorized without permission", async () => {
    const users = new InMemoryUserRepository();
    const user = createUser({ id: "u1" });
    await users.save(user);
    const result = await assertPermission(
      users,
      "u1",
      { type: "faq", permission: FAQPermission.CREATE_FAQ },
      "faq_not_authorized",
    );
    expectErr(result, "faq_not_authorized");
  });

  test("ok with entity requester that has permission", async () => {
    const users = new InMemoryUserRepository();
    const user = createUser({
      id: "u1",
      grants: [{ type: "faq", permission: FAQPermission.CREATE_FAQ }],
    });
    const result = await assertPermission(
      users,
      user,
      { type: "faq", permission: FAQPermission.CREATE_FAQ },
      "faq_not_authorized",
    );
    expectOk(result);
  });
});
