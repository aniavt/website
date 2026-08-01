import { describe, expect, test } from "bun:test";
import { assertMediaUrl, extractInternalMediaId } from "@application/shared/assertMediaUrl";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { createFile } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("extractInternalMediaId", () => {
  test("parses relative and absolute media paths", () => {
    expect(extractInternalMediaId("/api/media/abc")).toBe("abc");
    expect(extractInternalMediaId("https://host.example/api/media/abc?x=1")).toBe("abc");
    expect(extractInternalMediaId("https://cdn.example.com/cover.png")).toBeNull();
    expect(extractInternalMediaId("")).toBeNull();
  });
});

describe("assertMediaUrl", () => {
  test("allows empty, external, and existing internal refs", async () => {
    const files = new InMemoryFileRepository();
    await files.save(createFile({ id: "pub" }));
    expectOk(await assertMediaUrl(files, undefined, "e"));
    expectOk(await assertMediaUrl(files, "https://cdn.example.com/x.png", "e"));
    expectOk(await assertMediaUrl(files, "/api/media/pub", "e"));
  });

  test("rejects missing internal refs", async () => {
    const files = new InMemoryFileRepository();
    expectErr(await assertMediaUrl(files, "/api/media/missing", "e"), "e");
  });
});
