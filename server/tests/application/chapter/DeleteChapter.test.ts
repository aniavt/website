import { describe, expect, test } from "bun:test";
import { DeleteChapterUseCase } from "@application/chapter/use-cases/DeleteChapter";
import { InMemoryChapterRepository } from "../../doubles/InMemoryChapterRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createChapter, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("DeleteChapterUseCase", () => {
  async function setup() {
    const chapters = new InMemoryChapterRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.DELETE_ANIME }],
      }),
    );
    return { chapters, users, uc: new DeleteChapterUseCase(chapters, users) };
  }

  test("deletes chapter", async () => {
    const { chapters, uc } = await setup();
    await chapters.save(createChapter({ id: "c1" }));
    expectOk(await uc.execute("admin", "c1"));
    expect(await chapters.findById("c1")).toBeNull();
  });

  test("unauthorized / not found", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "c1"), "chapter_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "chapter_not_found");
  });
});
