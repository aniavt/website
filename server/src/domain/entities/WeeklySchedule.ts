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

    /** ISO-8601: week (1–53) and year (week-year, can differ from calendar year at boundaries). */
    static getISOWeekAndYear(date: Date): { week: number; year: number } {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = d.getUTCDay() || 7; // 1=Mon … 7=Sun
        d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday of this week
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
        return { week, year: d.getUTCFullYear() };
    }

    /** @deprecated Use getISOWeekAndYear for ISO week/year; this returns ISO week only. */
    static getWeekNumber(date: Date): number {
        return WeeklySchedule.getISOWeekAndYear(date).week;
    }
}
