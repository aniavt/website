import { describe, expect, test } from "bun:test";
import { createAnime, createFaqItem, createNavItem } from "../helpers/factories";

describe("soft-delete entity transitions", () => {
  test("Anime markDeleted / restore / invalid from deleted", () => {
    const anime = createAnime({ lastAction: "created" });
    expect(anime.markDeleted()).toBe(true);
    expect(anime.active).toBe(false);
    expect(anime.lastAction).toBe("deleted");
    expect(anime.applyUpdate({ title: "x" })).toBe(false);
    expect(anime.restore()).toBe(true);
    expect(anime.active).toBe(true);
    expect(anime.lastAction).toBe("restore");
  });

  test("Anime cannot delete twice", () => {
    const anime = createAnime({ lastAction: "deleted", active: false });
    expect(anime.markDeleted()).toBe(false);
  });

  test("NavItems markDeleted / restore", () => {
    const nav = createNavItem({ lastAction: "updated" });
    expect(nav.markDeleted()).toBe(true);
    expect(nav.restore()).toBe(true);
  });

  test("FaqItem markDeleted / restore / invalid update when deleted", () => {
    const faq = createFaqItem({ lastAction: "created" });
    expect(faq.markDeleted()).toBe(true);
    expect(faq.applyUpdate("q2", "a2")).toBe(false);
    expect(faq.restore()).toBe(true);
    expect(faq.applyUpdate("q2", "a2")).toBe(true);
  });
});
