import { describe, expect, test } from "bun:test";
import { DeleteAnimeUseCase } from "@application/anime/use-cases/DeleteAnime";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createAnime, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("DeleteAnimeUseCase", () => {
  async function setup() {
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    const admin = createUser({
      id: "admin",
      grants: [{ type: "anime", permission: AnimePermission.DELETE_ANIME }],
    });
    await users.save(admin);
    return { animes, users, uc: new DeleteAnimeUseCase(animes, users) };
  }

  test("soft-deletes active anime", async () => {
    const { animes, uc } = await setup();
    await animes.save(createAnime({ id: "a1", lastAction: "created" }));
    expectOk(await uc.execute("admin", "a1"));
    const saved = await animes.findById("a1");
    expect(saved?.active).toBe(false);
    expect(saved?.lastAction).toBe("deleted");
  });

  test("unauthorized / not found / invalid transition", async () => {
    const { animes, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "a1"), "anime_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "anime_not_found");
    await animes.save(createAnime({ id: "a1", lastAction: "deleted", active: false }));
    expectErr(await uc.execute("admin", "a1"), "anime_invalid_transition");
  });
});
