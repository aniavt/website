import { describe, expect, test } from "bun:test";
import { getISOWeekAndYear } from "@ania/date";
import { GetCurrentWeekScheduleUseCase } from "@application/weekly_schedule/use-cases/GetCurrentWeekSchedule";
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

describe("GetCurrentWeekScheduleUseCase", () => {
  test("returns schedule for current ISO week", async () => {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const files = new InMemoryFileRepository();
    const users = new InMemoryUserRepository();
    const { week, year } = getISOWeekAndYear(new Date());
    await files.save(createFile({ id: "file-1" }));
    await schedules.save(createWeeklySchedule({ id: "ws-current", week, year, fileId: "file-1" }));
    const uc = new GetCurrentWeekScheduleUseCase(schedules, files, users);

    const dto = expectOk(await uc.execute(null));
    expect(dto.id).toBe("ws-current");
    expect(dto.week).toBe(week);
    expect(dto.year).toBe(year);
  });

  test("not found when no schedule for current week", async () => {
    const uc = new GetCurrentWeekScheduleUseCase(
      new InMemoryWeeklyScheduleRepository(),
      new InMemoryFileRepository(),
      new InMemoryUserRepository(),
    );
    expectErr(await uc.execute(null), "weekly_schedule_not_found");
  });

  test("admin can see deleted current week schedule", async () => {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const files = new InMemoryFileRepository();
    const users = new InMemoryUserRepository();
    const { week, year } = getISOWeekAndYear(new Date());
    await files.save(createFile({ id: "file-1" }));
    await schedules.save(
      createWeeklySchedule({ id: "ws-del", week, year, isDeleted: true, fileId: "file-1" }),
    );
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE }],
      }),
    );
    const uc = new GetCurrentWeekScheduleUseCase(schedules, files, users);
    const dto = expectOk(await uc.execute("admin"));
    expect(dto.isDeleted).toBe(true);
  });
});
