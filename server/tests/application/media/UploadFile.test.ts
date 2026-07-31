import { describe, expect, test } from "bun:test";
import { UploadFileUseCase } from "@application/media/use-cases/UploadFile";
import { FakeMediaService } from "../../doubles/FakeMediaService";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { expectErr, expectOk } from "../../helpers/result";

describe("UploadFileUseCase", () => {
  test("rejects invalid input", async () => {
    const uc = new UploadFileUseCase(new FakeMediaService(), new InMemoryFileRepository());
    expectErr(
      await uc.execute({
        name: "",
        contentType: "image/png",
        size: 100,
        body: new Uint8Array([1]),
        isPrivate: false,
      }),
      "media_invalid_input",
    );
    expectErr(
      await uc.execute({
        name: "a.png",
        contentType: "image/png",
        size: 0,
        body: new Uint8Array(),
        isPrivate: false,
      }),
      "media_invalid_input",
    );
  });

  test("uploads and saves metadata", async () => {
    const media = new FakeMediaService();
    const files = new InMemoryFileRepository();
    const uc = new UploadFileUseCase(media, files);
    const dto = expectOk(
      await uc.execute({
        name: "cover.png",
        contentType: "image/png",
        size: 42,
        body: new Uint8Array([1, 2, 3]),
        isPrivate: true,
      }),
    );
    expect(dto.name).toBe("cover.png");
    expect(dto.isPrivate).toBe(true);
    expect(await files.findById(dto.id)).not.toBeNull();
  });
});
