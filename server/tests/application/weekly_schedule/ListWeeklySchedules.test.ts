import { describe, expect, test } from "bun:test";
import { ListWeeklySchedulesUseCase } from "@application/weekly_schedule/use-cases/ListWeeklySchedules";
import { InMemoryWeeklyScheduleRepository } from "../../doubles/InMemoryWeeklyScheduleRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import {
  WeeklySchedulePermission,
  createFile,
  createUser,
  createWeeklySchedule,
} from "../../helpers/factories";
import { expectOk } from "../../helpers/result";

describe("ListWeeklySchedulesUseCase", () => {
  async function seed() {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const files = new InMemoryFileRepository();
    const users = new InMemoryUserRepository();
    await files.save(createFile({ id: "file-1" }));
    await schedules.save(createWeeklySchedule({ id: "ws-2026-a", week: 1, year: 2026, fileId: "file-1" }));
    await schedules.save(createWeeklySchedule({ id: "ws-2026-b", week: 2, year: 2026, fileId: "file-1" }));
    await schedules.save(
      createWeeklySchedule({ id: "ws-del", week: 3, year: 2026, isDeleted: true, fileId: "file-1" }),
    );
    await schedules.save(createWeeklySchedule({ id: "ws-2025", week: 1, year: 2025, fileId: "file-1" }));
    const uc = new ListWeeklySchedulesUseCase(schedules, files, users);
    return { users, uc };
  }

  test("anonymous sees non-deleted schedules only", async () => {
    const { uc } = await seed();
    const items = expectOk(await uc.execute(null));
    expect(items.map((i) => i.id).sort()).toEqual(["ws-2025", "ws-2026-a", "ws-2026-b"]);
  });

  test("filters by year", async () => {
    const { uc } = await seed();
    const items = expectOk(await uc.execute(null, { year: 2026 }));
    expect(items).toHaveLength(2);
  });

  test("admin can include deleted with option", async () => {
    const { users, uc } = await seed();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE }],
      }),
    );
    const items = expectOk(await uc.execute("admin", { includeDeleted: true }));
    expect(items.some((i) => i.id === "ws-del")).toBe(true);
  });

  test("includeDeleted ignored without permission", async () => {
    const { uc } = await seed();
    const items = expectOk(await uc.execute(null, { includeDeleted: true }));
    expect(items.some((i) => i.id === "ws-del")).toBe(false);
  });
});
