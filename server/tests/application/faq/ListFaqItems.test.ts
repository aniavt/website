import { describe, expect, test } from "bun:test";
import { ListFaqItemsUseCase } from "@application/faq/use-cases/ListFaqItems";
import { InMemoryFaqItemRepository } from "../../doubles/InMemoryFaqItemRepository";
import { InMemoryFaqTextRepository } from "../../doubles/InMemoryFaqTextRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import {
  FAQPermission,
  createFaqItem,
  createFaqText,
  createUser,
} from "../../helpers/factories";
import { expectOk } from "../../helpers/result";

describe("ListFaqItemsUseCase", () => {
  async function seed() {
    const faqItem = new InMemoryFaqItemRepository();
    const faqText = new InMemoryFaqTextRepository();
    const users = new InMemoryUserRepository();
    await faqText.save(createFaqText("q-1", "Active Q"));
    await faqText.save(createFaqText("a-1", "Active A"));
    await faqText.save(createFaqText("q-2", "Inactive Q"));
    await faqText.save(createFaqText("a-2", "Inactive A"));
    await faqItem.save(createFaqItem({ id: "faq-active", queryId: "q-1", answerId: "a-1" }));
    await faqItem.save(
      createFaqItem({
        id: "faq-inactive",
        queryId: "q-2",
        answerId: "a-2",
        isActive: false,
        lastAction: "deleted",
      }),
    );
    const uc = new ListFaqItemsUseCase(faqItem, faqText, users);
    return { users, uc };
  }

  test("anonymous user sees active items only", async () => {
    const { uc } = await seed();
    const items = expectOk(await uc.execute(null));
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("faq-active");
  });

  test("reader sees all items without activeOnly", async () => {
    const { users, uc } = await seed();
    await users.save(
      createUser({
        id: "reader",
        grants: [{ type: "faq", permission: FAQPermission.READ_FAQ }],
      }),
    );
    const items = expectOk(await uc.execute("reader"));
    expect(items).toHaveLength(2);
  });

  test("reader with activeOnly sees active only", async () => {
    const { users, uc } = await seed();
    await users.save(
      createUser({
        id: "reader",
        grants: [{ type: "faq", permission: FAQPermission.READ_FAQ }],
      }),
    );
    const items = expectOk(await uc.execute("reader", { activeOnly: true }));
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("faq-active");
  });
});
