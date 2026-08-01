import {
  canTransitionLastAction,
  type SoftDeleteLastAction,
} from "@domain/shared/canTransitionLastAction";

export type NavItemsLastAction = SoftDeleteLastAction;

export interface NavItemsProps {
  readonly id: string;
  title: string;
  path: string;
  position: number;
  active: boolean;
  lastAction: NavItemsLastAction;
  createdAt: Date;
  updatedAt: Date;
}

export class NavItems {
  readonly id: string;
  title: string;
  path: string;
  position: number;
  active: boolean;
  lastAction: NavItemsLastAction;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: NavItemsProps) {
    this.id = props.id;
    this.title = props.title;
    this.path = props.path;
    this.position = props.position;
    this.active = props.active;
    this.lastAction = props.lastAction;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static fromPersistence(props: NavItemsProps): NavItems {
    return new NavItems(props);
  }

  canTransitionTo(action: NavItemsLastAction): boolean {
    return canTransitionLastAction(this.lastAction, action);
  }

  applyUpdate(patch: {
    title?: string;
    path?: string;
    position?: number;
  }): boolean {
    if (!this.canTransitionTo("updated")) return false;
    if (patch.title !== undefined) this.title = patch.title;
    if (patch.path !== undefined) this.path = patch.path;
    if (patch.position !== undefined) this.position = patch.position;
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
