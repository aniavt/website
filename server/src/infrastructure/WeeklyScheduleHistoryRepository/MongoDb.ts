import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";
import mongoose from "mongoose";

const weeklyScheduleHistorySchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    scheduleId: { type: String, required: true },
    week: { type: Number, required: true },
    year: { type: Number, required: true },
    fileId: { type: String, required: true },
    action: { type: String, required: true, enum: ["created", "updated", "deleted", "restored"] },
    by: { type: String, required: true },
    timestamp: { type: Date, required: true },
});

interface WeeklyScheduleHistoryDocument {
    id: string;
    scheduleId: string;
    week: number;
    year: number;
    fileId: string;
    action: "created" | "updated" | "deleted" | "restored";
    by: string;
    timestamp: Date;
}

weeklyScheduleHistorySchema.index({ scheduleId: 1 });
weeklyScheduleHistorySchema.index({ week: 1, year: 1 });

function toDocument(entry: WeeklyScheduleHistoryEntry): WeeklyScheduleHistoryDocument {
    return {
        id: entry.id,
        scheduleId: entry.scheduleId,
        week: entry.week,
        year: entry.year,
        fileId: entry.fileId,
        action: entry.action,
        by: entry.by,
        timestamp: entry.timestamp,
    };
}

export class MongoDbWeeklyScheduleHistoryRepository implements WeeklyScheduleHistoryRepository {
    private readonly model: mongoose.Model<WeeklyScheduleHistoryDocument>;

    constructor(private readonly mongoClient: mongoose.Connection) {
        this.model = this.mongoClient.model<WeeklyScheduleHistoryDocument>(
            "WeeklyScheduleHistory",
            weeklyScheduleHistorySchema,
        );
    }

    async append(entry: WeeklyScheduleHistoryEntry): Promise<void> {
        await this.model.create(toDocument(entry));
    }

    async findByScheduleId(scheduleId: string): Promise<WeeklyScheduleHistoryEntry[]> {
        const docs = await this.model.find({ scheduleId }).sort({ timestamp: 1 }).exec();
        return docs.map((d) => WeeklyScheduleHistoryEntry.fromPersistence(d));
    }

    async findByWeekAndYear(week: number, year: number): Promise<WeeklyScheduleHistoryEntry[]> {
        const docs = await this.model.find({ week, year }).sort({ timestamp: 1 }).exec();
        return docs.map((d) => WeeklyScheduleHistoryEntry.fromPersistence(d));
    }
}
