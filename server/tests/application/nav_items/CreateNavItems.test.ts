import { describe, expect, test } from "bun:test";
import { CreateNavItemsUseCase } from "@application/nav_items/use-cases/CreateNavItems";
import { InMemoryNavItemsRepository } from "../../doubles/InMemoryNavItemsRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { NavItemsPermission, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("CreateNavItemsUseCase", () => {
  async function setup() {
    const navs = new InMemoryNavItemsRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("nav");
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "nav_items", permission: NavItemsPermission.CREATE_NAVITEMS }],
      }),
    );
    return { navs, users, uc: new CreateNavItemsUseCase(users, idGen, navs) };
  }

  test("creates nav item", async () => {
    const { navs, uc } = await setup();
    const dto = expectOk(
      await uc.execute("admin", { title: "About", path: "/about", position: 1 }),
    );
    expect(dto.id).toBe("nav-1");
    expect(dto.title).toBe("About");
    expect(dto.active).toBe(true);
    expect(await navs.findById("nav-1")).not.toBeNull();
  });

  test("unauthorized", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(
      await uc.execute("noperm", { title: "X", path: "/", position: 0 }),
      "nav_items_not_authorized",
    );
  });
});
