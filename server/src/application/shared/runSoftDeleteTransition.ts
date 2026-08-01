import { err, ok, type Result } from "@lib/result";
import { saveOrErr } from "./saveOrErr";

export async function runSoftDeleteTransition<T, const E>(opts: {
  find: () => Promise<T | null>;
  notFound: E;
  transition: (entity: T) => boolean;
  invalidTransition: E;
  save: (entity: T) => Promise<unknown>;
  saveFailed: E;
}): Promise<Result<T, E>> {
  const entity = await opts.find();
  if (!entity) return err(opts.notFound);

  if (!opts.transition(entity)) return err(opts.invalidTransition);

  const saved = await saveOrErr(opts.save(entity), opts.saveFailed);
  if (saved.isError()) return saved;

  return ok(entity);
}
