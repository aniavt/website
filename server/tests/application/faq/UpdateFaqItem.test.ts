import { describe, expect, test } from "bun:test";
import { UpdateFaqItemUseCase } from "@application/faq/use-cases/UpdateFaqItem";
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

describe("UpdateFaqItemUseCase", () => {
  async function setup() {
    const faqText = new InMemoryFaqTextRepository();
    const faqItem = new InMemoryFaqItemRepository();
    const faqHistory = new InMemoryFaqHistoryRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("faq");
    const tx = new FakeTransactionManager();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "faq", permission: FAQPermission.UPDATE_FAQ }],
      }),
    );
    await faqText.save(createFaqText("q-1", "Old query"));
    await faqText.save(createFaqText("a-1", "Old answer"));
    await faqItem.save(createFaqItem({ id: "faq-1", queryId: "q-1", answerId: "a-1" }));
    const uc = new UpdateFaqItemUseCase(faqText, faqItem, faqHistory, users, idGen, tx);
    return { faqText, faqItem, faqHistory, users, uc };
  }

  test("updates query and answer with history", async () => {
    const { faqItem, faqHistory, uc } = await setup();
    const dto = expectOk(
      await uc.execute("admin", { id: "faq-1", query: "New query", answer: "New answer" }),
    );
    expect(dto.query).toBe("New query");
    expect(dto.answer).toBe("New answer");
    expect(dto.lastAction).toBe("updated");

    const saved = await faqItem.findById("faq-1");
    expect(saved?.lastAction).toBe("updated");

    const history = await faqHistory.findByFaqId("faq-1");
    expect(history).toHaveLength(1);
    expect(history[0]?.action).toBe("updated");
  });

  test("returns current dto when no fields provided", async () => {
    const { uc } = await setup();
    const dto = expectOk(await uc.execute("admin", { id: "faq-1" }));
    expect(dto.query).toBe("Old query");
    expect(dto.answer).toBe("Old answer");
    expect(dto.lastAction).toBe("created");
  });

  test("unauthorized / not found / invalid transition", async () => {
    const { faqItem, users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", { id: "faq-1", query: "X" }), "faq_not_authorized");
    expectErr(await uc.execute("admin", { id: "missing", query: "X" }), "faq_item_not_found");
    await faqItem.save(
      createFaqItem({ id: "deleted", queryId: "q-1", answerId: "a-1", isActive: false, lastAction: "deleted" }),
    );
    expectErr(await uc.execute("admin", { id: "deleted", query: "X" }), "faq_invalid_transition");
  });
});
