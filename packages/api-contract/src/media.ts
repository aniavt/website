export interface FileDto {
  readonly id: string;
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
  readonly url: string;
  readonly isPrivate: boolean;
}

/** Alias used by admin upload helper. */
export type UploadMediaResult = FileDto;
