export type WeeklyScheduleHistoryAction = "created" | "updated" | "deleted" | "restored";

export interface WeeklyScheduleHistoryEntryProps {
    readonly id: string;
    readonly scheduleId: string;
    readonly week: number;
    readonly year: number;
    readonly fileId: string;
    readonly action: WeeklyScheduleHistoryAction;
    readonly by: string;
    readonly timestamp: Date;
}

export class WeeklyScheduleHistoryEntry {
    readonly id: string;
    readonly scheduleId: string;
    readonly week: number;
    readonly year: number;
    readonly fileId: string;
    readonly action: WeeklyScheduleHistoryAction;
    readonly by: string;
    readonly timestamp: Date;

    constructor(props: WeeklyScheduleHistoryEntryProps) {
        this.id = props.id;
        this.scheduleId = props.scheduleId;
        this.week = props.week;
        this.year = props.year;
        this.fileId = props.fileId;
        this.action = props.action;
        this.by = props.by;
        this.timestamp = props.timestamp;
    }

    static fromPersistence(props: WeeklyScheduleHistoryEntryProps): WeeklyScheduleHistoryEntry {
        return new WeeklyScheduleHistoryEntry(props);
    }
}
