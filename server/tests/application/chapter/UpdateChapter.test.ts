import { describe, expect, test } from "bun:test";
import { UpdateChapterUseCase } from "@application/chapter/use-cases/UpdateChapter";
import { InMemoryChapterRepository } from "../../doubles/InMemoryChapterRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createChapter, createFile, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("UpdateChapterUseCase", () => {
  async function setup() {
    const chapters = new InMemoryChapterRepository();
    const users = new InMemoryUserRepository();
    const files = new InMemoryFileRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.UPDATE_ANIME }],
      }),
    );
    return { chapters, users, files, uc: new UpdateChapterUseCase(chapters, users, files) };
  }

  test("updates chapter", async () => {
    const { chapters, uc } = await setup();
    await chapters.save(createChapter({ id: "c1", number: 1 }));
    const dto = expectOk(await uc.execute("admin", { id: "c1", number: 2, title: "New" }));
    expect(dto.number).toBe(2);
    expect(dto.title).toBe("New");
  });

  test("unauthorized / not found", async () => {
    const { chapters, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", { id: "c1", number: 2 }), "chapter_not_authorized");
    expectErr(await uc.execute("admin", { id: "missing", number: 2 }), "chapter_not_found");
  });

  test("rejects missing internal media URLs", async () => {
    const { chapters, uc } = await setup();
    await chapters.save(createChapter({ id: "c1" }));
    expectErr(
      await uc.execute("admin", { id: "c1", coverImageURL: "/api/media/missing" }),
      "chapter_file_not_found",
    );
  });

  test("accepts existing internal media and external URLs", async () => {
    const { chapters, files, uc } = await setup();
    await chapters.save(createChapter({ id: "c1" }));
    await files.save(createFile({ id: "pub" }));
    expectOk(
      await uc.execute("admin", {
        id: "c1",
        coverImageURL: "/api/media/pub",
        videoURL: "https://cdn.example.com/ep.mp4",
      }),
    );
  });
});
