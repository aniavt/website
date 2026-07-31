import { describe, expect, test } from "bun:test";
import { getISOWeekAndYear } from "@ania/date";
import { UpdateWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/UpdateWeeklySchedule";
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

describe("UpdateWeeklyScheduleUseCase", () => {
  async function setup(weekYear?: { week: number; year: number }) {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const history = new InMemoryWeeklyScheduleHistoryRepository();
    const files = new InMemoryFileRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("ws");
    const tx = new FakeTransactionManager();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.UPDATE_WEEKLY_SCHEDULE }],
      }),
    );
    await files.save(createFile({ id: "file-1", isPrivate: false }));
    await files.save(createFile({ id: "file-2", isPrivate: false }));
    await files.save(createFile({ id: "file-private", isPrivate: true }));
    const wy = weekYear ?? futureWeekYear();
    await schedules.save(createWeeklySchedule({ id: "ws-1", week: wy.week, year: wy.year, fileId: "file-1" }));
    const uc = new UpdateWeeklyScheduleUseCase(schedules, history, files, users, idGen, tx);
    return { schedules, history, users, uc, wy };
  }

  test("updates schedule and appends history", async () => {
    const { history, uc } = await setup();
    const dto = expectOk(
      await uc.execute("admin", { id: "ws-1", title: "Updated", fileId: "file-2" }),
    );
    expect(dto.title).toBe("Updated");
    expect(dto.fileId).toBe("file-2");

    const entries = await history.findByScheduleId("ws-1");
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe("updated");
  });

  test("rejects past schedule (week 1, year 2020)", async () => {
    const { uc } = await setup({ week: 1, year: 2020 });
    expectErr(
      await uc.execute("admin", { id: "ws-1", title: "Too late" }),
      "weekly_schedule_cannot_modify_past",
    );
  });

  test("unauthorized / not found / private file", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", { id: "ws-1", title: "X" }), "weekly_schedule_not_authorized");
    expectErr(await uc.execute("admin", { id: "missing", title: "X" }), "weekly_schedule_not_found");
    expectErr(
      await uc.execute("admin", { id: "ws-1", fileId: "file-private" }),
      "weekly_schedule_file_not_found",
    );
  });
});
