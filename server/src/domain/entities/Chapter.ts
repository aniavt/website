export interface ChapterProps {
   readonly id: string;
   readonly animeId: string;
   number: number;
   title?: string;
   videoURL?: string;
   coverImageURL?: string;
   createdAt: Date;
   updatedAt: Date;
}

export class Chapter {
   readonly id: string;
   readonly animeId: string;
   number: number;
   title?: string;
   videoURL?: string;
   coverImageURL?: string;
   createdAt: Date;
   updatedAt: Date;

   constructor(props: ChapterProps) {
      this.id = props.id;
      this.animeId = props.animeId;
      this.number = props.number;
      this.title = props.title;
      this.videoURL = props.videoURL;
      this.coverImageURL = props.coverImageURL;
      this.createdAt = props.createdAt;
      this.updatedAt = props.updatedAt;
   }

   static fromPersistence(props: ChapterProps): Chapter {
      return new Chapter(props);
   }

   applyUpdate(patch: {
      number?: number;
      title?: string;
      videoURL?: string;
      coverImageURL?: string;
   }): void {
      if (patch.number !== undefined) this.number = patch.number;
      if (patch.title !== undefined) this.title = patch.title;
      if (patch.videoURL !== undefined) this.videoURL = patch.videoURL;
      if (patch.coverImageURL !== undefined) this.coverImageURL = patch.coverImageURL;
      this.updatedAt = new Date();
   }
}
