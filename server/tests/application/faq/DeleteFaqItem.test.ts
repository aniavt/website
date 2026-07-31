import { describe, expect, test } from "bun:test";
import { DeleteFaqItemUseCase } from "@application/faq/use-cases/DeleteFaqItem";
import { InMemoryFaqItemRepository } from "../../doubles/InMemoryFaqItemRepository";
import { InMemoryFaqTextRepository } from "../../doubles/InMemoryFaqTextRepository";
import { InMemoryFaqHistoryRepository } from "../../doubles/InMemoryFaqHistoryRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeTransactionManager } from "../../doubles/FakeTransactionManager";
import {
  FAQPermission,
  createFaqItem,
  createFaqText,
  createUser,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("DeleteFaqItemUseCase", () => {
  async function setup() {
    const faqItem = new InMemoryFaqItemRepository();
    const faqText = new InMemoryFaqTextRepository();
    const faqHistory = new InMemoryFaqHistoryRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("faq");
    const tx = new FakeTransactionManager();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "faq", permission: FAQPermission.DELETE_FAQ }],
      }),
    );
    await faqText.save(createFaqText("q-1", "Query"));
    await faqText.save(createFaqText("a-1", "Answer"));
    await faqItem.save(createFaqItem({ id: "faq-1", queryId: "q-1", answerId: "a-1" }));
    const uc = new DeleteFaqItemUseCase(faqItem, faqText, faqHistory, users, idGen, tx);
    return { faqItem, faqHistory, users, uc };
  }

  test("soft-deletes and appends history", async () => {
    const { faqItem, faqHistory, uc } = await setup();
    const dto = expectOk(await uc.execute("admin", "faq-1"));
    expect(dto.isActive).toBe(false);
    expect(dto.lastAction).toBe("deleted");

    const saved = await faqItem.findById("faq-1");
    expect(saved?.isActive).toBe(false);
    expect(saved?.lastAction).toBe("deleted");

    const history = await faqHistory.findByFaqId("faq-1");
    expect(history).toHaveLength(1);
    expect(history[0]?.action).toBe("deleted");
  });

  test("unauthorized / not found / invalid transition", async () => {
    const { faqItem, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "faq-1"), "faq_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "faq_item_not_found");
    await faqItem.save(
      createFaqItem({ id: "faq-1", queryId: "q-1", answerId: "a-1", isActive: false, lastAction: "deleted" }),
    );
    expectErr(await uc.execute("admin", "faq-1"), "faq_invalid_transition");
  });
});
