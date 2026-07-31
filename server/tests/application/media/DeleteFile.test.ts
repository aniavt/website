import { describe, expect, test } from "bun:test";
import { DeleteFileUseCase } from "@application/media/use-cases/DeleteFile";
import { FakeMediaService } from "../../doubles/FakeMediaService";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { createFile } from "../../helpers/factories";
import { expectOk } from "../../helpers/result";

describe("DeleteFileUseCase", () => {
  test("missing id returns ok", async () => {
    const uc = new DeleteFileUseCase(new FakeMediaService(), new InMemoryFileRepository());
    expectOk(await uc.execute("missing"));
  });

  test("deletes from storage and repository", async () => {
    const media = new FakeMediaService();
    const files = new InMemoryFileRepository();
    const file = createFile({ id: "f1" });
    await files.save(file);
    media.seed(file);
    const uc = new DeleteFileUseCase(media, files);
    expectOk(await uc.execute("f1"));
    expect(await files.findById("f1")).toBeNull();
    expect(media.deletedIds).toContain("f1");
  });
});
