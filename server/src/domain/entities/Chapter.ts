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
}
