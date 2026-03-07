export type FaqItemLastAction = "created" | "updated" | "deleted" | "restore";

export interface FaqItemProps {
    readonly id: string;
    readonly queryId: string;
    readonly answerId: string;
    isActive: boolean;
    lastAction: FaqItemLastAction;
}

export class FaqItem {
    readonly id: string;
    readonly queryId: string;
    readonly answerId: string;
    isActive: boolean;
    lastAction: FaqItemLastAction;

    constructor(props: FaqItemProps) {
        this.id = props.id;
        this.queryId = props.queryId;
        this.answerId = props.answerId;
        this.isActive = props.isActive;
        this.lastAction = props.lastAction;
    }

    static fromPersistence(props: FaqItemProps): FaqItem {
        return new FaqItem(props);
    }

    canTransitionTo(action: FaqItemLastAction): boolean {
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
