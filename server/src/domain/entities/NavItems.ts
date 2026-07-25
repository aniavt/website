export type NavItemsLastAction = "created" | "updated" | "deleted" | "restore";

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
