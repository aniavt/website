import {
    canTransitionLastAction,
    type SoftDeleteLastAction,
} from "@domain/shared/canTransitionLastAction";

export type FaqItemLastAction = SoftDeleteLastAction;

export interface FaqItemProps {
    readonly id: string;
    queryId: string;
    answerId: string;
    isActive: boolean;
    lastAction: FaqItemLastAction;
}

export class FaqItem {
    readonly id: string;
    queryId: string;
    answerId: string;
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
        return canTransitionLastAction(this.lastAction, action);
    }

    applyUpdate(queryId: string, answerId: string): boolean {
        if (!this.canTransitionTo("updated")) return false;
        this.queryId = queryId;
        this.answerId = answerId;
        this.lastAction = "updated";
        return true;
    }

    markDeleted(): boolean {
        if (!this.canTransitionTo("deleted")) return false;
        this.isActive = false;
        this.lastAction = "deleted";
        return true;
    }

    restore(): boolean {
        if (!this.canTransitionTo("restore")) return false;
        this.isActive = true;
        this.lastAction = "restore";
        return true;
    }
}
