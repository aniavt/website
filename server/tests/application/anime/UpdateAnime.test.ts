import { describe, expect, test } from "bun:test";
import { UpdateAnimeUseCase } from "@application/anime/use-cases/UpdateAnime";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createAnime, createFile, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("UpdateAnimeUseCase", () => {
  async function setup() {
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    const files = new InMemoryFileRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.UPDATE_ANIME }],
      }),
    );
    return { animes, users, files, uc: new UpdateAnimeUseCase(animes, users, files) };
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

  test("rejects missing internal media cover", async () => {
    const { animes, uc } = await setup();
    await animes.save(createAnime({ id: "a1" }));
    expectErr(
      await uc.execute("admin", { id: "a1", coverImageURL: "/api/media/missing" }),
      "anime_file_not_found",
    );
  });

  test("accepts existing internal media and external cover URLs", async () => {
    const { animes, files, uc } = await setup();
    await animes.save(createAnime({ id: "a1" }));
    await files.save(createFile({ id: "pub" }));
    expectOk(await uc.execute("admin", { id: "a1", coverImageURL: "/api/media/pub" }));
    expectOk(
      await uc.execute("admin", { id: "a1", coverImageURL: "https://cdn.example.com/c.png" }),
    );
  });
});
