import type { FileRepository } from "@domain/repositories/FileRepository";
import { err, ok, type Result } from "@lib/result";

/** Matches `/api/media/<id>` or any absolute URL whose pathname ends that way. */
const INTERNAL_MEDIA_PATH = /(?:^|\/)api\/media\/([^/?#]+)(?:[?#]|$)/;

export function extractInternalMediaId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const path = trimmed.startsWith("/")
      ? trimmed
      : new URL(trimmed).pathname;
    const match = path.match(INTERNAL_MEDIA_PATH);
    return match?.[1] ?? null;
  } catch {
    const match = trimmed.match(INTERNAL_MEDIA_PATH);
    return match?.[1] ?? null;
  }
}

/**
 * If `url` points at an internal `/api/media/:id` ref, require the file to exist.
 * External / empty URLs pass through.
 */
export async function assertMediaUrl<E extends string>(
  fileRepository: FileRepository,
  url: string | undefined,
  notFoundError: E,
): Promise<Result<void, E>> {
  if (url === undefined || url.trim() === "") return ok(undefined);

  const mediaId = extractInternalMediaId(url);
  if (!mediaId) return ok(undefined);

  const file = await fileRepository.findById(mediaId);
  if (!file) return err(notFoundError);

  return ok(undefined);
}
