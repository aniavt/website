import { describe, expect, test } from "bun:test";
import { GetFileUrlUseCase } from "@application/media/use-cases/GetFileUrl";
import { FakeMediaService } from "../../doubles/FakeMediaService";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { createFile } from "../../helpers/factories";

describe("GetFileUrlUseCase", () => {
  test("returns null when file missing", async () => {
    const uc = new GetFileUrlUseCase(new InMemoryFileRepository(), new FakeMediaService());
    expect(await uc.execute("missing")).toBeNull();
  });

  test("returns url from media service", async () => {
    const media = new FakeMediaService();
    const files = new InMemoryFileRepository();
    const file = createFile({ id: "f1" });
    await files.save(file);
    media.seed(file);
    const uc = new GetFileUrlUseCase(files, media);
    expect(await uc.execute("f1")).toBe("https://fake.local/f1");
  });
});
