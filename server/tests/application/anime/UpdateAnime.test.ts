import { describe, expect, test } from "bun:test";
import { UpdateAnimeUseCase } from "@application/anime/use-cases/UpdateAnime";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createAnime, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("UpdateAnimeUseCase", () => {
  async function setup() {
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.UPDATE_ANIME }],
      }),
    );
    return { animes, users, uc: new UpdateAnimeUseCase(animes, users) };
  }

  test("updates active anime", async () => {
    const { animes, uc } = await setup();
    await animes.save(createAnime({ id: "a1", title: "Old" }));
    const dto = expectOk(await uc.execute("admin", { id: "a1", title: "New" }));
    expect(dto.title).toBe("New");
    expect(dto.lastAction).toBe("updated");
  });

  test("unauthorized / not found / invalid transition", async () => {
    const { animes, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", { id: "a1", title: "X" }), "anime_not_authorized");
    expectErr(await uc.execute("admin", { id: "missing", title: "X" }), "anime_not_found");
    await animes.save(createAnime({ id: "a1", lastAction: "deleted", active: false }));
    expectErr(await uc.execute("admin", { id: "a1", title: "X" }), "anime_invalid_transition");
  });
});
