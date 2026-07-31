import { describe, expect, test } from "bun:test";
import { GetNavItemsByIdUseCase } from "@application/navItems/use-cases/GetNavItemsById";
import { InMemoryNavItemsRepository } from "../../doubles/InMemoryNavItemsRepository";
import { createNavItem } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetNavItemsByIdUseCase", () => {
  test("returns nav item dto", async () => {
    const navs = new InMemoryNavItemsRepository();
    await navs.save(createNavItem({ id: "n1", title: "Home" }));
    const uc = new GetNavItemsByIdUseCase(navs);
    const dto = expectOk(await uc.execute("n1"));
    expect(dto.title).toBe("Home");
  });

  test("not found", async () => {
    const uc = new GetNavItemsByIdUseCase(new InMemoryNavItemsRepository());
    expectErr(await uc.execute("missing"), "navItems_not_found");
  });
});
