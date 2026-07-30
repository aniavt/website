export interface WeeklyScheduleTag {
    readonly label: string;
    readonly bgColor: string;
    readonly txColor: string;
}

export interface WeeklyScheduleProps {
    readonly id: string;
    readonly week: number;
    readonly year: number;
    readonly fileId: string;
    readonly isDeleted: boolean;
    readonly title: string;
    readonly description: string;
    readonly tags: readonly WeeklyScheduleTag[];
}

export class WeeklySchedule {
    readonly id: string;
    readonly week: number;
    readonly year: number;
    readonly fileId: string;
    readonly isDeleted: boolean;
    readonly title: string;
    readonly description: string;
    readonly tags: readonly WeeklyScheduleTag[];

    constructor(props: WeeklyScheduleProps) {
        this.id = props.id;
        this.week = props.week;
        this.year = props.year;
        this.fileId = props.fileId;
        this.isDeleted = props.isDeleted;
        this.title = props.title;
        this.description = props.description;
        this.tags = props.tags;
    }

    isWeekValid(): boolean {
        return this.week >= 1 && this.week <= 53;
    }
}
