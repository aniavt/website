import { describe, expect, test } from "bun:test";
import { CreateChapterUseCase } from "@application/chapter/use-cases/CreateChapter";
import { InMemoryChapterRepository } from "../../doubles/InMemoryChapterRepository";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { AnimePermission, createAnime, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("CreateChapterUseCase", () => {
  async function setup() {
    const chapters = new InMemoryChapterRepository();
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("ch");
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.CREATE_ANIME }],
      }),
    );
    await animes.save(createAnime({ id: "a1" }));
    return {
      chapters,
      uc: new CreateChapterUseCase(chapters, animes, users, idGen),
    };
  }

  test("creates chapter for existing anime", async () => {
    const { chapters, uc } = await setup();
    const dto = expectOk(
      await uc.execute("admin", { animeId: "a1", number: 1, title: "Pilot" }),
    );
    expect(dto.id).toBe("ch-1");
    expect(dto.animeId).toBe("a1");
    expect(dto.number).toBe(1);
    expect(await chapters.findById("ch-1")).not.toBeNull();
  });

  test("unauthorized / anime not found", async () => {
    const chapters = new InMemoryChapterRepository();
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("ch");
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.CREATE_ANIME }],
      }),
    );
    await users.save(createUser({ id: "noperm" }));
    const uc = new CreateChapterUseCase(chapters, animes, users, idGen);
    expectErr(
      await uc.execute("noperm", { animeId: "a1", number: 1 }),
      "chapter_not_authorized",
    );
    expectErr(
      await uc.execute("admin", { animeId: "missing", number: 1 }),
      "anime_not_found",
    );
  });
});
