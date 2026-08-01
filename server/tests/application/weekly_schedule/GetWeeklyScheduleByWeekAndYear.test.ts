import { describe, expect, test } from "bun:test";
import { GetWeeklyScheduleByWeekAndYearUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleByWeekAndYear";
import { InMemoryWeeklyScheduleRepository } from "../../doubles/InMemoryWeeklyScheduleRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import {
  WeeklySchedulePermission,
  createFile,
  createUser,
  createWeeklySchedule,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetWeeklyScheduleByWeekAndYearUseCase", () => {
  async function seed() {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const files = new InMemoryFileRepository();
    const users = new InMemoryUserRepository();
    await files.save(createFile({ id: "file-1" }));
    await schedules.save(createWeeklySchedule({ id: "ws-1", week: 10, year: 2026, fileId: "file-1" }));
    await schedules.save(
      createWeeklySchedule({ id: "ws-del", week: 11, year: 2026, isDeleted: true, fileId: "file-1" }),
    );
    const uc = new GetWeeklyScheduleByWeekAndYearUseCase(schedules, files, users);
    return { users, uc };
  }

  test("returns schedule by week and year", async () => {
    const { uc } = await seed();
    const dto = expectOk(await uc.execute(null, 10, 2026));
    expect(dto.id).toBe("ws-1");
  });

  test("rejects invalid week", async () => {
    const { uc } = await seed();
    expectErr(await uc.execute(null, 0, 2026), "weekly_schedule_invalid_week");
    expectErr(await uc.execute(null, 54, 2026), "weekly_schedule_invalid_week");
  });

  test("not found for deleted without permission", async () => {
    const { uc } = await seed();
    expectErr(await uc.execute(null, 11, 2026), "weekly_schedule_not_found");
  });

  test("admin with delete permission sees deleted", async () => {
    const { users, uc } = await seed();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE }],
      }),
    );
    const dto = expectOk(await uc.execute("admin", 11, 2026));
    expect(dto.isDeleted).toBe(true);
  });
});
