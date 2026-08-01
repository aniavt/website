import { describe, expect, test } from "bun:test";
import { DeleteNavItemsUseCase } from "@application/nav_items/use-cases/DeleteNavItems";
import { InMemoryNavItemsRepository } from "../../doubles/InMemoryNavItemsRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { NavItemsPermission, createNavItem, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("DeleteNavItemsUseCase", () => {
  async function setup() {
    const navs = new InMemoryNavItemsRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "nav_items", permission: NavItemsPermission.DELETE_NAVITEMS }],
      }),
    );
    return { navs, users, uc: new DeleteNavItemsUseCase(users, navs) };
  }

  test("soft-deletes nav item", async () => {
    const { navs, uc } = await setup();
    await navs.save(createNavItem({ id: "n1" }));
    expectOk(await uc.execute("admin", "n1"));
    expect((await navs.findById("n1"))?.lastAction).toBe("deleted");
  });

  test("error branches", async () => {
    const { navs, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "n1"), "nav_items_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "nav_items_not_found");
    await navs.save(createNavItem({ id: "n1", lastAction: "deleted", active: false }));
    expectErr(await uc.execute("admin", "n1"), "nav_items_invalid_transition");
  });
});
