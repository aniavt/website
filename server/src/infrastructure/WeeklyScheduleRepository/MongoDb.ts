import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import type {
    WeeklyScheduleRepository,
    WeeklyScheduleFindAllOptions,
    FindByIdOptions,
    FindByWeekAndYearOptions,
} from "@domain/repositories/WeeklyScheduleRepository";
import mongoose from "mongoose";

const weeklyScheduleTagSchema = new mongoose.Schema(
    {
        label: { type: String, required: true },
        bgColor: { type: String, required: true },
        txColor: { type: String, required: true },
    },
    { _id: false },
);

const weeklyScheduleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    week: { type: Number, required: true },
    year: { type: Number, required: true },
    fileId: { type: String, required: true },
    isDeleted: { type: Boolean, required: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    tags: { type: [weeklyScheduleTagSchema], default: [] },
});

interface WeeklyScheduleTagDocument {
    label: string;
    bgColor: string;
    txColor: string;
}

interface WeeklyScheduleDocument {
    id: string;
    week: number;
    year: number;
    fileId: string;
    isDeleted: boolean;
    title?: string;
    description?: string;
    tags?: WeeklyScheduleTagDocument[];
}

weeklyScheduleSchema.index({ week: 1, year: 1 }, { unique: true });

function toDocument(schedule: WeeklySchedule): WeeklyScheduleDocument {
    return {
        id: schedule.id,
        week: schedule.week,
        year: schedule.year,
        fileId: schedule.fileId,
        isDeleted: schedule.isDeleted,
        title: schedule.title,
        description: schedule.description,
        tags: [...schedule.tags],
    };
}

function toEntity(doc: WeeklyScheduleDocument): WeeklySchedule {
    return new WeeklySchedule({
        id: doc.id,
        week: doc.week,
        year: doc.year,
        fileId: doc.fileId,
        isDeleted: doc.isDeleted,
        title: doc.title ?? "",
        description: doc.description ?? "",
        tags: doc.tags ?? [],
    });
}

export class MongoDbWeeklyScheduleRepository implements WeeklyScheduleRepository {
    private readonly model: mongoose.Model<WeeklyScheduleDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<WeeklyScheduleDocument>(
            "WeeklySchedule",
            weeklyScheduleSchema,
        );
    }

    async save(schedule: WeeklySchedule): Promise<void> {
        const doc = toDocument(schedule);
        const existing = await this.model.findOne({ id: schedule.id });
        if (existing) {
            await this.model.updateOne({ id: schedule.id }, { $set: doc });
        } else {
            await this.model.create(doc);
        }
    }

    async findById(id: string, options?: FindByIdOptions): Promise<WeeklySchedule | null> {
        const filter: { id: string; isDeleted?: boolean } = { id };
        if (options?.includeDeleted !== true) {
            filter.isDeleted = false;
        }
        const doc = await this.model.findOne(filter);
        return doc ? toEntity(doc) : null;
    }

    async findByWeekAndYear(week: number, year: number, options?: FindByWeekAndYearOptions): Promise<WeeklySchedule | null> {
        const filter: { week: number; year: number; isDeleted?: boolean } = { week, year };
        if (options?.includeDeleted !== true) {
            filter.isDeleted = false;
        }
        const doc = await this.model.findOne(filter);
        return doc ? toEntity(doc) : null;
    }

    async findAll(options?: WeeklyScheduleFindAllOptions): Promise<WeeklySchedule[]> {
        const query: { year?: number; isDeleted?: boolean } = {};
        if (options?.year !== undefined) {
            query.year = options.year;
        }
        if (options?.includeDeleted !== true) {
            query.isDeleted = false;
        }
        const docs = await this.model.find(query).sort({ year: 1, week: 1 }).exec();
        return docs.map(toEntity);
    }

    async delete(id: string): Promise<void> {
        await this.model.deleteOne({ id });
    }
}
