export interface WeeklyScheduleProps {
    readonly id: string;
    readonly week: number;
    readonly year: number;
    readonly fileId: string;
    readonly isDeleted: boolean;
}

export class WeeklySchedule {
    readonly id: string;
    readonly week: number;
    readonly year: number;
    readonly fileId: string;
    readonly isDeleted: boolean;

    constructor(props: WeeklyScheduleProps) {
        this.id = props.id;
        this.week = props.week;
        this.year = props.year;
        this.fileId = props.fileId;
        this.isDeleted = props.isDeleted;
    }

    isWeekValid(): boolean {
        return this.week >= 1 && this.week <= 52;
    }

    isCurrentWeek(): boolean {
        const currentDate = new Date();
        const currentWeek = WeeklySchedule.getWeekNumber(currentDate);
        const currentYear = currentDate.getFullYear();
    
        return this.week === currentWeek && this.year === currentYear;
    }

    static getWeekNumber(date: Date): number {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDays = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        return Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    }
}
