import { describe, expect, test } from "bun:test";
import { RestoreAnimeUseCase } from "@application/anime/use-cases/RestoreAnime";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createAnime, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("RestoreAnimeUseCase", () => {
  async function setup() {
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.RESTORE_ANIME }],
      }),
    );
    return { animes, users, uc: new RestoreAnimeUseCase(animes, users) };
  }

  test("restores deleted anime", async () => {
    const { animes, uc } = await setup();
    await animes.save(createAnime({ id: "a1", lastAction: "deleted", active: false }));
    expectOk(await uc.execute("admin", "a1"));
    const saved = await animes.findById("a1");
    expect(saved?.active).toBe(true);
    expect(saved?.lastAction).toBe("restore");
  });

  test("unauthorized / not found / invalid transition", async () => {
    const { animes, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "a1"), "anime_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "anime_not_found");
    await animes.save(createAnime({ id: "a1", lastAction: "created" }));
    expectErr(await uc.execute("admin", "a1"), "anime_invalid_transition");
  });
});
