import { describe, expect, test } from "bun:test";
import { CreateAnimeUseCase } from "@application/anime/use-cases/CreateAnime";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { AnimePermission, createFile, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("CreateAnimeUseCase", () => {
  async function setup() {
    const animes = new InMemoryAnimeRepository();
    const users = new InMemoryUserRepository();
    const files = new InMemoryFileRepository();
    const idGen = new FakeIdGenerator("anime");
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.CREATE_ANIME }],
      }),
    );
    return { animes, users, files, uc: new CreateAnimeUseCase(animes, users, idGen, files) };
  }

  test("creates anime with generated id", async () => {
    const { animes, uc } = await setup();
    const dto = expectOk(
      await uc.execute("admin", {
        title: "Naruto",
        genre: "action",
        status: "watching",
      }),
    );
    expect(dto.id).toBe("anime-1");
    expect(dto.title).toBe("Naruto");
    expect(dto.active).toBe(true);
    expect(dto.lastAction).toBe("created");
    expect(await animes.findById("anime-1")).not.toBeNull();
  });

  test("unauthorized", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(
      await uc.execute("noperm", { title: "X", genre: "action", status: "watching" }),
      "anime_not_authorized",
    );
  });

  test("rejects missing internal media cover", async () => {
    const { uc } = await setup();
    expectErr(
      await uc.execute("admin", {
        title: "X",
        genre: "action",
        status: "watching",
        coverImageURL: "/api/media/missing",
      }),
      "anime_file_not_found",
    );
  });

  test("accepts existing internal media and external cover URLs", async () => {
    const { files, uc } = await setup();
    await files.save(createFile({ id: "pub" }));
    expectOk(
      await uc.execute("admin", {
        title: "With media",
        genre: "action",
        status: "watching",
        coverImageURL: "/api/media/pub",
      }),
    );
    expectOk(
      await uc.execute("admin", {
        title: "External",
        genre: "action",
        status: "watching",
        coverImageURL: "https://cdn.example.com/cover.png",
      }),
    );
  });
});
