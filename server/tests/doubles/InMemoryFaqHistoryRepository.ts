import type { FaqHistoryEntry } from "@domain/entities/FaqHistoryEntry";
import type { FaqHistoryRepository } from "@domain/repositories/FaqHistoryRepository";

export class InMemoryFaqHistoryRepository implements FaqHistoryRepository {
  private entries: FaqHistoryEntry[] = [];

  async append(entry: FaqHistoryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async findByFaqId(faqId: string): Promise<FaqHistoryEntry[]> {
    return this.entries.filter((e) => e.faqId === faqId);
  }
}
