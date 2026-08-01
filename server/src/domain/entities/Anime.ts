import {
  canTransitionLastAction,
  type SoftDeleteLastAction,
} from "@domain/shared/canTransitionLastAction";
import type { AnimeStatus } from "@ania/domain-shared/anime";

export type AnimeLastAction = SoftDeleteLastAction;

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
    return canTransitionLastAction(this.lastAction, action);
  }

  applyUpdate(patch: {
    title?: string;
    description?: string;
    coverImageURL?: string;
    genre?: string;
    status?: AnimeStatus;
  }): boolean {
    if (!this.canTransitionTo("updated")) return false;
    if (patch.title !== undefined) this.title = patch.title;
    if (patch.description !== undefined) this.description = patch.description;
    if (patch.coverImageURL !== undefined) this.coverImageURL = patch.coverImageURL;
    if (patch.genre !== undefined) this.genre = patch.genre;
    if (patch.status !== undefined) this.status = patch.status;
    this.lastAction = "updated";
    this.updatedAt = new Date();
    return true;
  }

  markDeleted(): boolean {
    if (!this.canTransitionTo("deleted")) return false;
    this.active = false;
    this.lastAction = "deleted";
    this.updatedAt = new Date();
    return true;
  }

  restore(): boolean {
    if (!this.canTransitionTo("restore")) return false;
    this.active = true;
    this.lastAction = "restore";
    this.updatedAt = new Date();
    return true;
  }
}
