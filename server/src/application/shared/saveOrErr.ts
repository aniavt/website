import { err, ok, type Result } from "@lib/result";

export async function saveOrErr<const E>(
  savePromise: Promise<unknown>,
  saveFailed: E,
): Promise<Result<void, E>> {
  try {
    await savePromise;
    return ok(undefined);
  } catch (error) {
    console.error(saveFailed, error);
    return err(saveFailed);
  }
}
