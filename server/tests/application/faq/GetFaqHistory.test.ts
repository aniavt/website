import { describe, expect, test } from "bun:test";
import { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import { GetFaqHistoryUseCase } from "@application/faq/use-cases/GetFaqHistory";
import { InMemoryFaqItemRepository } from "../../doubles/InMemoryFaqItemRepository";
import { InMemoryFaqHistoryRepository } from "../../doubles/InMemoryFaqHistoryRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FAQPermission, createFaqItem, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetFaqHistoryUseCase", () => {
  async function setup() {
    const faqHistory = new InMemoryFaqHistoryRepository();
    const faqItem = new InMemoryFaqItemRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        username: "administrator",
        grants: [{ type: "faq", permission: FAQPermission.READ_FAQ }],
      }),
    );
    await faqItem.save(createFaqItem({ id: "faq-1" }));
    await faqHistory.append(
      new FaqHistoryEntry({
        id: "h-1",
        faqId: "faq-1",
        queryId: "q-1",
        answerId: "a-1",
        action: "created",
        by: "admin",
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    const uc = new GetFaqHistoryUseCase(faqHistory, faqItem, users);
    return { users, uc };
  }

  test("returns history with usernames", async () => {
    const { uc } = await setup();
    const entries = expectOk(await uc.execute("admin", "faq-1"));
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe("created");
    expect(entries[0]?.byUsername).toBe("administrator");
  });

  test("unauthorized / not found", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "faq-1"), "faq_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "faq_item_not_found");
  });
});
