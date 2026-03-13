/** Always returns a relative URL for use in HTML (browser requests via Nginx). */
export function getMediaUrl(fileId: string): string {
  return `/api/media/${fileId}`;
}

export function isImage(contentType?: string | null): boolean {
  return contentType?.startsWith("image/") ?? false;
}

export function isVideo(contentType?: string | null): boolean {
  return contentType?.startsWith("video/") ?? false;
}

