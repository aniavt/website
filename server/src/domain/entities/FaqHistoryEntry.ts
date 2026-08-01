import type { SoftDeleteLastAction } from "@ania/domain-shared/soft-delete";

export interface FaqHistoryEntryProps {
    readonly id: string;
    readonly faqId: string;
    readonly queryId: string;
    readonly answerId: string;
    readonly action: SoftDeleteLastAction;
    readonly by: string;
    readonly timestamp: Date;
}

export class FaqHistoryEntry {
    readonly id: string;
    readonly faqId: string;
    readonly queryId: string;
    readonly answerId: string;
    readonly action: SoftDeleteLastAction;
    readonly by: string;
    readonly timestamp: Date;

    constructor(props: FaqHistoryEntryProps) {
        this.id = props.id;
        this.faqId = props.faqId;
        this.queryId = props.queryId;
        this.answerId = props.answerId;
        this.action = props.action;
        this.by = props.by;
        this.timestamp = props.timestamp;
    }

    static fromPersistence(props: FaqHistoryEntryProps): FaqHistoryEntry {
        return new FaqHistoryEntry(props);
    }
}
