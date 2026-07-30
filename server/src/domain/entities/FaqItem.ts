import {
    canTransitionLastAction,
    type SoftDeleteLastAction,
} from "@domain/shared/canTransitionLastAction";

export type FaqItemLastAction = SoftDeleteLastAction;

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
        return canTransitionLastAction(this.lastAction, action);
    }
}
