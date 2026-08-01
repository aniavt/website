export interface WeeklyScheduleTag {
    readonly label: string;
    readonly bgColor: string;
    readonly txColor: string;
}

export interface WeeklyScheduleProps {
    readonly id: string;
    readonly week: number;
    readonly year: number;
    fileId: string;
    isDeleted: boolean;
    title: string;
    description: string;
    tags: readonly WeeklyScheduleTag[];
}

export class WeeklySchedule {
    readonly id: string;
    readonly week: number;
    readonly year: number;
    fileId: string;
    isDeleted: boolean;
    title: string;
    description: string;
    tags: readonly WeeklyScheduleTag[];

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

    applyUpdate(patch: {
        fileId?: string;
        title?: string;
        description?: string;
        tags?: readonly WeeklyScheduleTag[];
    }): void {
        if (patch.fileId !== undefined) this.fileId = patch.fileId;
        if (patch.title !== undefined) this.title = patch.title;
        if (patch.description !== undefined) this.description = patch.description;
        if (patch.tags !== undefined) this.tags = patch.tags;
    }

    markDeleted(): void {
        this.isDeleted = true;
    }

    restore(): void {
        if (!this.isDeleted) return;
        this.isDeleted = false;
    }
}
