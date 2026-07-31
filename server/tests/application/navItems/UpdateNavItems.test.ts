import { describe, expect, test } from "bun:test";
import { UpdateNavItemsUseCase } from "@application/navItems/use-cases/UpdateNavItems";
import { InMemoryNavItemsRepository } from "../../doubles/InMemoryNavItemsRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { NavItemsPermission, createNavItem, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("UpdateNavItemsUseCase", () => {
  async function setup() {
    const navs = new InMemoryNavItemsRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "navItems", permission: NavItemsPermission.UPDATE_NAVITEMS }],
      }),
    );
    return { navs, users, uc: new UpdateNavItemsUseCase(users, navs) };
  }

  test("updates nav item", async () => {
    const { navs, uc } = await setup();
    await navs.save(createNavItem({ id: "n1", title: "Old" }));
    const dto = expectOk(await uc.execute("admin", { id: "n1", title: "New" }));
    expect(dto.title).toBe("New");
    expect(dto.lastAction).toBe("updated");
  });

  test("unauthorized / not found / invalid transition", async () => {
    const { navs, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", { id: "n1", title: "X" }), "navItems_not_authorized");
    expectErr(await uc.execute("admin", { id: "missing", title: "X" }), "navItems_not_found");
    await navs.save(createNavItem({ id: "n1", lastAction: "deleted", active: false }));
    expectErr(await uc.execute("admin", { id: "n1", title: "X" }), "navItems_invalid_transition");
  });
});
