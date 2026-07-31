import { describe, expect, test } from "bun:test";
import { RestoreNavItemsUseCase } from "@application/navItems/use-cases/RestoreNavItems";
import { InMemoryNavItemsRepository } from "../../doubles/InMemoryNavItemsRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { NavItemsPermission, createNavItem, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("RestoreNavItemsUseCase", () => {
  async function setup() {
    const navs = new InMemoryNavItemsRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "navItems", permission: NavItemsPermission.RESTORE_NAVITEMS }],
      }),
    );
    return { navs, users, uc: new RestoreNavItemsUseCase(users, navs) };
  }

  test("restores deleted nav item", async () => {
    const { navs, uc } = await setup();
    await navs.save(createNavItem({ id: "n1", lastAction: "deleted", active: false }));
    expectOk(await uc.execute("admin", "n1"));
    const saved = await navs.findById("n1");
    expect(saved?.active).toBe(true);
    expect(saved?.lastAction).toBe("restore");
  });

  test("unauthorized / not found / invalid transition", async () => {
    const { navs, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "n1"), "navItems_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "navItems_not_found");
    await navs.save(createNavItem({ id: "n1", lastAction: "created" }));
    expectErr(await uc.execute("admin", "n1"), "navItems_invalid_transition");
  });
});
