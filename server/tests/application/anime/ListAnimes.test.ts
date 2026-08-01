import { describe, expect, test } from "bun:test";
import { ListAnimesUseCase } from "@application/anime/use-cases/ListAnimes";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createAnime, createUser } from "../../helpers/factories";
import { expectOk } from "../../helpers/result";

describe("ListAnimesUseCase", () => {
  async function seed() {
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    await animes.save(createAnime({ id: "active", title: "Active" }));
    await animes.save(createAnime({ id: "inactive", title: "Inactive", active: false, lastAction: "deleted" }));
    await users.save(
      createUser({
        id: "reader",
        grants: [{ type: "anime", permission: AnimePermission.READ_ANIME }],
      }),
    );
    return { animes, users, uc: new ListAnimesUseCase(animes, users) };
  }

  test("without READ permission only lists active", async () => {
    const { users, uc } = await seed();
    await users.save(createUser({ id: "noperm" }));
    const list = expectOk(await uc.execute("noperm"));
    expect(list.map((a) => a.id)).toEqual(["active"]);
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
    expect(list.map((a) => a.id).sort()).toEqual(["active", "inactive"]);
  });
});
