import { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import type {
    WeeklyScheduleRepository,
    WeeklyScheduleFindAllOptions,
} from "@domain/repositories/WeeklyScheduleRepository";
import mongoose from "mongoose";

const weeklyScheduleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    week: { type: Number, required: true },
    year: { type: Number, required: true },
    fileId: { type: String, required: true },
    isDeleted: { type: Boolean, required: true },
});

interface WeeklyScheduleDocument {
    id: string;
    week: number;
    year: number;
    fileId: string;
    isDeleted: boolean;
}

weeklyScheduleSchema.index({ week: 1, year: 1 }, { unique: true });

function toDocument(schedule: WeeklySchedule): WeeklyScheduleDocument {
    return {
        id: schedule.id,
        week: schedule.week,
        year: schedule.year,
        fileId: schedule.fileId,
        isDeleted: schedule.isDeleted,
    };
}

function toEntity(doc: WeeklyScheduleDocument): WeeklySchedule {
    return new WeeklySchedule(doc);
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

    async findById(id: string): Promise<WeeklySchedule | null> {
        const doc = await this.model.findOne({ id });
        return doc ? toEntity(doc) : null;
    }

    async findByWeekAndYear(week: number, year: number): Promise<WeeklySchedule | null> {
        const doc = await this.model.findOne({ week, year });
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
