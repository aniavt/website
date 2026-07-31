import { describe, expect, test } from "bun:test";
import { getISOWeekAndYear } from "@ania/date";
import { CreateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/CreateWeeklySchedule";
import { InMemoryWeeklyScheduleRepository } from "../../doubles/InMemoryWeeklyScheduleRepository";
import { InMemoryWeeklyScheduleHistoryRepository } from "../../doubles/InMemoryWeeklyScheduleHistoryRepository";
import { InMemoryFileRepository } from "../../doubles/InMemoryFileRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeTransactionManager } from "../../doubles/FakeTransactionManager";
import {
  WeeklySchedulePermission,
  createFile,
  createUser,
  createWeeklySchedule,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

function futureWeekYear(): { week: number; year: number } {
  const { week, year } = getISOWeekAndYear(new Date());
  if (week >= 53) return { week: 1, year: year + 1 };
  return { week: week + 1, year };
}

describe("CreateWeeklyScheduleUseCase", () => {
  async function setup() {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const history = new InMemoryWeeklyScheduleHistoryRepository();
    const files = new InMemoryFileRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("ws");
    const tx = new FakeTransactionManager();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.CREATE_WEEKLY_SCHEDULE }],
      }),
    );
    await files.save(createFile({ id: "file-public", isPrivate: false }));
    await files.save(createFile({ id: "file-private", isPrivate: true }));
    const uc = new CreateWeeklyScheduleUseCase(schedules, history, files, users, idGen, tx);
    return { schedules, history, files, users, uc };
  }

  test("creates schedule with public file and appends history", async () => {
    const { schedules, history, uc } = await setup();
    const { week, year } = futureWeekYear();
    const dto = expectOk(
      await uc.execute("admin", { week, year, fileId: "file-public", title: "Week title" }),
    );
    expect(dto.week).toBe(week);
    expect(dto.year).toBe(year);
    expect(dto.fileId).toBe("file-public");
    expect(dto.isDeleted).toBe(false);

    const saved = await schedules.findByWeekAndYear(week, year);
    expect(saved).not.toBeNull();

    const entries = await history.findByScheduleId(dto.id);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe("created");
  });

  test("rejects invalid week 0 and 54", async () => {
    const { uc } = await setup();
    const { year } = futureWeekYear();
    expectErr(await uc.execute("admin", { week: 0, year, fileId: "file-public" }), "weekly_schedule_invalid_week");
    expectErr(await uc.execute("admin", { week: 54, year, fileId: "file-public" }), "weekly_schedule_invalid_week");
  });

  test("rejects private or missing file", async () => {
    const { uc } = await setup();
    const { week, year } = futureWeekYear();
    expectErr(
      await uc.execute("admin", { week, year, fileId: "file-private" }),
      "weekly_schedule_file_not_found",
    );
    expectErr(
      await uc.execute("admin", { week, year, fileId: "missing" }),
      "weekly_schedule_file_not_found",
    );
  });

  test("rejects duplicate week/year", async () => {
    const { schedules, uc } = await setup();
    const { week, year } = futureWeekYear();
    await schedules.save(createWeeklySchedule({ id: "existing", week, year, fileId: "file-public" }));
    expectErr(
      await uc.execute("admin", { week, year, fileId: "file-public" }),
      "weekly_schedule_duplicate_week_year",
    );
  });

  test("unauthorized", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    const { week, year } = futureWeekYear();
    expectErr(
      await uc.execute("noperm", { week, year, fileId: "file-public" }),
      "weekly_schedule_not_authorized",
    );
  });
});
