export interface FileDto {
  readonly id: string;
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
  readonly url: string;
}

/** Alias used by admin upload helper. */
export type UploadMediaResult = FileDto;

/** Shared upload constraints (multipart). */
export const UPLOAD_MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MiB

export const UPLOAD_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type UploadAllowedMimeType = (typeof UPLOAD_ALLOWED_MIME_TYPES)[number];

export const UPLOAD_FILENAME_MAX = 255;
