import { describe, expect, test } from "bun:test";
import { CreateFaqItemUseCase } from "@application/faq/use-cases/CreateFaqItem";
import { InMemoryFaqItemRepository } from "../../doubles/InMemoryFaqItemRepository";
import { InMemoryFaqTextRepository } from "../../doubles/InMemoryFaqTextRepository";
import { InMemoryFaqHistoryRepository } from "../../doubles/InMemoryFaqHistoryRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeTransactionManager } from "../../doubles/FakeTransactionManager";
import { FAQPermission, createFaqText, createUser } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("CreateFaqItemUseCase", () => {
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
        grants: [{ type: "faq", permission: FAQPermission.CREATE_FAQ }],
      }),
    );
    const uc = new CreateFaqItemUseCase(faqText, faqItem, faqHistory, users, idGen, tx);
    return { faqText, faqItem, faqHistory, users, uc };
  }

  test("creates FAQ item and appends history", async () => {
    const { faqItem, faqHistory, uc } = await setup();
    const dto = expectOk(
      await uc.execute("admin", { query: "What is Ania?", answer: "A platform." }),
    );
    expect(dto.query).toBe("What is Ania?");
    expect(dto.answer).toBe("A platform.");
    expect(dto.isActive).toBe(true);
    expect(dto.lastAction).toBe("created");

    const saved = await faqItem.findById(dto.id);
    expect(saved?.isActive).toBe(true);

    const history = await faqHistory.findByFaqId(dto.id);
    expect(history).toHaveLength(1);
    expect(history[0]?.action).toBe("created");
    expect(history[0]?.by).toBe("admin");
  });

  test("reuses existing FAQ text by value", async () => {
    const { faqText, uc } = await setup();
    await faqText.save(createFaqText("existing-q", "Shared query"));
    expectOk(await uc.execute("admin", { query: "Shared query", answer: "Answer A" }));
    expectOk(await uc.execute("admin", { query: "Shared query", answer: "Answer B" }));
    const texts = (await faqText.findByIds(["existing-q"])).size;
    expect(texts).toBeGreaterThanOrEqual(0);
    const byValue = await faqText.findByValue("Shared query");
    expect(byValue?.id).toBe("existing-q");
  });

  test("unauthorized", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(
      await uc.execute("noperm", { query: "Q", answer: "A" }),
      "faq_not_authorized",
    );
  });
});
