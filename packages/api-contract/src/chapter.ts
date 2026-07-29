export interface ChapterDto {
  readonly id: string;
  readonly animeId: string;
  readonly number: number;
  readonly title?: string;
  readonly videoURL?: string;
  readonly coverImageURL?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** HTTP body for POST /anime/:animeId/chapters */
export interface CreateChapterInput {
  number: number;
  title?: string;
  videoURL?: string;
  coverImageURL?: string;
}

/** HTTP body for PATCH /chapters/:id */
export interface UpdateChapterInput {
  number?: number;
  title?: string;
  videoURL?: string;
  coverImageURL?: string;
}
