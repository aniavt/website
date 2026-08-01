import { describe, expect, test } from "bun:test";
import { ListChaptersByAnimeUseCase } from "@application/chapter/use-cases/ListChaptersByAnime";
import { InMemoryChapterRepository } from "../../doubles/InMemoryChapterRepository";
import { createChapter } from "../../helpers/factories";
import { expectOk } from "../../helpers/result";

describe("ListChaptersByAnimeUseCase", () => {
  test("returns chapters sorted by number", async () => {
    const chapters = new InMemoryChapterRepository();
    await chapters.save(createChapter({ id: "c3", animeId: "a1", number: 3 }));
    await chapters.save(createChapter({ id: "c1", animeId: "a1", number: 1 }));
    await chapters.save(createChapter({ id: "c2", animeId: "a1", number: 2 }));
    await chapters.save(createChapter({ id: "other", animeId: "a2", number: 1 }));
    const uc = new ListChaptersByAnimeUseCase(chapters);
    const list = expectOk(await uc.execute("a1"));
    expect(list.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
  });

  test("empty list for unknown anime", async () => {
    const uc = new ListChaptersByAnimeUseCase(new InMemoryChapterRepository());
    expect(expectOk(await uc.execute("missing"))).toEqual([]);
  });
});
