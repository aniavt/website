export type MediaError =
    | "media_not_found"
    | "media_invalid_input"
    | "media_upload_failed"
    | "media_delete_failed";

const MEDIA_ERRORS: ReadonlySet<string> = new Set([
    "media_not_found",
    "media_invalid_input",
    "media_upload_failed",
    "media_delete_failed",
]);

export function mediaErrorFromUnknown(error: unknown, fallback: MediaError): MediaError {
    if (error instanceof Error && MEDIA_ERRORS.has(error.message)) {
        return error.message as MediaError;
    }
    return fallback;
}
