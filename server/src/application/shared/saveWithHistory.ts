import { err, ok, type Result } from "@lib/result";
import type { TransactionManager } from "./TransactionManager";

export async function saveWithHistory<const E>(opts: {
  tx: TransactionManager;
  persist: () => Promise<void>;
  append: () => Promise<void>;
  saveFailed: E;
}): Promise<Result<void, E>> {
  try {
    await opts.tx.runInTransaction(async () => {
      await opts.persist();
      await opts.append();
    });
    return ok(undefined);
  } catch (error) {
    console.error(opts.saveFailed, error);
    return err(opts.saveFailed);
  }
}
