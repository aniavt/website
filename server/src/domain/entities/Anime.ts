export type AnimeLastAction = "created" | "updated" | "deleted" | "restore";

export type AnimeStatus = "watching" | "completed" | "upcoming";

export interface AnimeProps {
  readonly id: string;
  title: string;
  description?: string;
  coverImageURL?: string;
  genre: string;
  status: AnimeStatus;
  active: boolean;
  lastAction: AnimeLastAction;
  createdAt: Date;
  updatedAt: Date;
}

export class Anime {
  readonly id: string;
  title: string;
  description?: string;
  coverImageURL?: string;
  genre: string;
  status: AnimeStatus;
  active: boolean;
  lastAction: AnimeLastAction;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: AnimeProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.coverImageURL = props.coverImageURL;
    this.genre = props.genre;
    this.status = props.status;
    this.active = props.active;
    this.lastAction = props.lastAction;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromPersistence(props: AnimeProps): Anime {
    return new Anime(props);
  }

  canTransitionTo(action: AnimeLastAction): boolean {
    switch (this.lastAction) {
      case "created":
      case "updated":
      case "restore":
        return action === "updated" || action === "deleted";
      case "deleted":
        return action === "restore";
      default:
        return false;
    }
  }
}
