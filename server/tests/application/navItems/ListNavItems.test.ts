import { describe, expect, test } from "bun:test";
import { ListNavItemsUseCase } from "@application/navItems/use-cases/ListNavItems";
import { InMemoryNavItemsRepository } from "../../doubles/InMemoryNavItemsRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { NavItemsPermission, createNavItem, createUser } from "../../helpers/factories";
import { expectOk } from "../../helpers/result";

describe("ListNavItemsUseCase", () => {
  async function seed() {
    const navs = new InMemoryNavItemsRepository();
    const users = new InMemoryUserRepository();
    await navs.save(createNavItem({ id: "active", title: "Active" }));
    await navs.save(createNavItem({ id: "inactive", title: "Inactive", active: false, lastAction: "deleted" }));
    await users.save(
      createUser({
        id: "reader",
        grants: [{ type: "navItems", permission: NavItemsPermission.READ_NAVITEMS }],
      }),
    );
    return { navs, users, uc: new ListNavItemsUseCase(users, navs) };
  }

  test("without READ permission only lists active", async () => {
    const { users, uc } = await seed();
    await users.save(createUser({ id: "noperm" }));
    const list = expectOk(await uc.execute("noperm"));
    expect(list.map((n) => n.id)).toEqual(["active"]);
  });

  test("anonymous request only lists active", async () => {
    const { uc } = await seed();
    const list = expectOk(await uc.execute(null));
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe("active");
  });

  test("with READ permission lists all including inactive", async () => {
    const { uc } = await seed();
    const list = expectOk(await uc.execute("reader"));
    expect(list.map((n) => n.id).sort()).toEqual(["active", "inactive"]);
  });
});
