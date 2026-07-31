import { describe, expect, test } from "bun:test";
import { StoredMediaService } from "@infrastructure/StoredMediaService";
import { FakeObjectStorage } from "../../doubles/FakeObjectStorage";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { createFile } from "../../helpers/factories";

describe("StoredMediaService", () => {
  test("upload rejects invalid input", async () => {
    const media = new StoredMediaService(new FakeObjectStorage(), new InMemoryFileRepository());
    await expect(
      media.upload({
        name: "",
        contentType: "image/png",
        size: 100,
        body: new Uint8Array([1]),
        isPrivate: false,
      }),
    ).rejects.toThrow("media_invalid_input");
    await expect(
      media.upload({
        name: "a.png",
        contentType: "image/png",
        size: 0,
        body: new Uint8Array(),
        isPrivate: false,
      }),
    ).rejects.toThrow("media_invalid_input");
  });

  test("upload saves metadata", async () => {
    const storage = new FakeObjectStorage();
    const files = new InMemoryFileRepository();
    const media = new StoredMediaService(storage, files);
    const file = await media.upload({
      name: "cover.png",
      contentType: "image/png",
      size: 42,
      body: new Uint8Array([1, 2, 3]),
      isPrivate: true,
    });
    expect(file.name).toBe("cover.png");
    expect(file.isPrivate).toBe(true);
    expect(await files.findById(file.id)).not.toBeNull();
  });

  test("delete missing id is a no-op", async () => {
    const media = new StoredMediaService(new FakeObjectStorage(), new InMemoryFileRepository());
    await media.delete("missing");
  });

  test("delete removes from storage and repository", async () => {
    const storage = new FakeObjectStorage();
    const files = new InMemoryFileRepository();
    const file = createFile({ id: "f1" });
    await files.save(file);
    storage.seed(file);
    const media = new StoredMediaService(storage, files);
    await media.delete("f1");
    expect(await files.findById("f1")).toBeNull();
    expect(storage.deletedIds).toContain("f1");
  });

  test("getUrl returns null when file missing", async () => {
    const media = new StoredMediaService(new FakeObjectStorage(), new InMemoryFileRepository());
    expect(await media.getUrl("missing")).toBeNull();
  });

  test("getUrl returns url from object storage", async () => {
    const storage = new FakeObjectStorage();
    const files = new InMemoryFileRepository();
    const file = createFile({ id: "f1" });
    await files.save(file);
    storage.seed(file);
    const media = new StoredMediaService(storage, files);
    expect(await media.getUrl("f1")).toBe("https://fake.local/f1");
  });
});
