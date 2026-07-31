import type { WeeklySchedule } from "@domain/entities/WeeklySchedule";
import type {
  FindByIdOptions,
  FindByWeekAndYearOptions,
  WeeklyScheduleFindAllOptions,
  WeeklyScheduleRepository,
} from "@domain/repositories/WeeklyScheduleRepository";

export class InMemoryWeeklyScheduleRepository implements WeeklyScheduleRepository {
  private items: WeeklySchedule[] = [];

  async save(schedule: WeeklySchedule): Promise<void> {
    const idx = this.items.findIndex((s) => s.id === schedule.id);
    if (idx >= 0) this.items[idx] = schedule;
    else this.items.push(schedule);
  }

  async findById(id: string, options?: FindByIdOptions): Promise<WeeklySchedule | null> {
    const found = this.items.find((s) => s.id === id) ?? null;
    if (!found) return null;
    if (!options?.includeDeleted && found.isDeleted) return null;
    return found;
  }

  async findByWeekAndYear(
    week: number,
    year: number,
    options?: FindByWeekAndYearOptions,
  ): Promise<WeeklySchedule | null> {
    const found = this.items.find((s) => s.week === week && s.year === year) ?? null;
    if (!found) return null;
    if (!options?.includeDeleted && found.isDeleted) return null;
    return found;
  }

  async findAll(options?: WeeklyScheduleFindAllOptions): Promise<WeeklySchedule[]> {
    let result = [...this.items];
    if (options?.year !== undefined) {
      result = result.filter((s) => s.year === options.year);
    }
    if (!options?.includeDeleted) {
      result = result.filter((s) => !s.isDeleted);
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((s) => s.id !== id);
  }
}
