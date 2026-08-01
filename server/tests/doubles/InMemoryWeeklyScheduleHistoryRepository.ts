import type { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import type { WeeklyScheduleHistoryRepository } from "@domain/repositories/WeeklyScheduleHistoryRepository";

export class InMemoryWeeklyScheduleHistoryRepository implements WeeklyScheduleHistoryRepository {
  private entries: WeeklyScheduleHistoryEntry[] = [];

  async append(entry: WeeklyScheduleHistoryEntry): Promise<void> {
    this.entries.push(entry);
  }

  async findByScheduleId(scheduleId: string): Promise<WeeklyScheduleHistoryEntry[]> {
    return this.entries.filter((e) => e.scheduleId === scheduleId);
  }

  async findByWeekAndYear(week: number, year: number): Promise<WeeklyScheduleHistoryEntry[]> {
    return this.entries.filter((e) => e.week === week && e.year === year);
  }
}
