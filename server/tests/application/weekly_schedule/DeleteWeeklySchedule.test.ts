import { describe, expect, test } from "bun:test";
import { getISOWeekAndYear } from "@ania/date";
import { DeleteWeeklyScheduleUseCase } from "@application/weekly_schedule/use-cases/DeleteWeeklySchedule";
import { InMemoryWeeklyScheduleRepository } from "../../doubles/InMemoryWeeklyScheduleRepository";
import { InMemoryWeeklyScheduleHistoryRepository } from "../../doubles/InMemoryWeeklyScheduleHistoryRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import { FakeIdGenerator } from "../../doubles/FakeIdGenerator";
import { FakeTransactionManager } from "../../doubles/FakeTransactionManager";
import {
  WeeklySchedulePermission,
  createUser,
  createWeeklySchedule,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

function futureWeekYear(): { week: number; year: number } {
  const { week, year } = getISOWeekAndYear(new Date());
  if (week >= 53) return { week: 1, year: year + 1 };
  return { week: week + 1, year };
}

describe("DeleteWeeklyScheduleUseCase", () => {
  async function setup(weekYear?: { week: number; year: number }) {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const history = new InMemoryWeeklyScheduleHistoryRepository();
    const users = new InMemoryUserRepository();
    const idGen = new FakeIdGenerator("ws");
    const tx = new FakeTransactionManager();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE }],
      }),
    );
    const wy = weekYear ?? futureWeekYear();
    await schedules.save(createWeeklySchedule({ id: "ws-1", week: wy.week, year: wy.year }));
    const uc = new DeleteWeeklyScheduleUseCase(schedules, history, users, idGen, tx);
    return { schedules, history, users, uc };
  }

  test("soft-deletes and appends history", async () => {
    const { schedules, history, uc } = await setup();
    const dto = expectOk(await uc.execute("admin", "ws-1"));
    expect(dto.isDeleted).toBe(true);

    const saved = await schedules.findById("ws-1");
    expect(saved).toBeNull();

    const deleted = await schedules.findById("ws-1", { includeDeleted: true });
    expect(deleted?.isDeleted).toBe(true);

    const entries = await history.findByScheduleId("ws-1");
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe("deleted");
  });

  test("rejects past schedule (week 1, year 2020)", async () => {
    const { uc } = await setup({ week: 1, year: 2020 });
    expectErr(await uc.execute("admin", "ws-1"), "weekly_schedule_cannot_modify_past");
  });

  test("unauthorized / not found", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "ws-1"), "weekly_schedule_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "weekly_schedule_not_found");
  });
});
