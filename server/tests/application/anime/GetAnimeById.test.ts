import { describe, expect, test } from "bun:test";
import { GetAnimeByIdUseCase } from "@application/anime/use-cases/GetAnimeById";
import { InMemoryAnimeRepository } from "../../doubles/InMemoryAnimeRepository";
import { createAnime } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetAnimeByIdUseCase", () => {
  test("returns anime dto", async () => {
    const animes = new InMemoryAnimeRepository();
    await animes.save(createAnime({ id: "a1", title: "One Piece" }));
    const uc = new GetAnimeByIdUseCase(animes);
    const dto = expectOk(await uc.execute("a1"));
    expect(dto.title).toBe("One Piece");
  });

  test("not found", async () => {
    const uc = new GetAnimeByIdUseCase(new InMemoryAnimeRepository());
    expectErr(await uc.execute("missing"), "anime_not_found");
  });
});
