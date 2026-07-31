import type { TransactionManager } from "@application/shared/TransactionManager";

export class FakeTransactionManager implements TransactionManager {
  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  }
}
