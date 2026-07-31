import { describe, expect, test } from "bun:test";
import { GetFaqItemUseCase } from "@application/faq/use-cases/GetFaqItem";
import { InMemoryFaqItemRepository } from "../../doubles/InMemoryFaqItemRepository";
import { InMemoryFaqTextRepository } from "../../doubles/InMemoryFaqTextRepository";
import { createFaqItem, createFaqText } from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetFaqItemUseCase", () => {
  test("returns resolved FAQ item", async () => {
    const faqItem = new InMemoryFaqItemRepository();
    const faqText = new InMemoryFaqTextRepository();
    await faqText.save(createFaqText("q-1", "Question?"));
    await faqText.save(createFaqText("a-1", "Answer."));
    await faqItem.save(createFaqItem({ id: "faq-1", queryId: "q-1", answerId: "a-1" }));
    const uc = new GetFaqItemUseCase(faqItem, faqText);

    const dto = expectOk(await uc.execute("faq-1"));
    expect(dto.id).toBe("faq-1");
    expect(dto.query).toBe("Question?");
    expect(dto.answer).toBe("Answer.");
  });

  test("not found", async () => {
    const uc = new GetFaqItemUseCase(
      new InMemoryFaqItemRepository(),
      new InMemoryFaqTextRepository(),
    );
    expectErr(await uc.execute("missing"), "faq_item_not_found");
  });
});
