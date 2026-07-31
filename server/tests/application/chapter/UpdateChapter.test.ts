import { describe, expect, test } from "bun:test";
import { UpdateChapterUseCase } from "@application/chapter/use-cases/UpdateChapter";
import { InMemoryChapterRepository } from "../../doubles/InMemoryChapterRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { AnimePermission, createChapter, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("UpdateChapterUseCase", () => {
  async function setup() {
    const chapters = new InMemoryChapterRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "anime", permission: AnimePermission.UPDATE_ANIME }],
      }),
    );
    return { chapters, users, uc: new UpdateChapterUseCase(chapters, users) };
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
});
