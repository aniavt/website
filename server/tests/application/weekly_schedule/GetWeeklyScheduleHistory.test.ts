import { describe, expect, test } from "bun:test";
import { WeeklyScheduleHistoryEntry } from "@domain/entities/WeeklyScheduleHistoryEntry";
import { GetWeeklyScheduleHistoryUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleHistory";
import { InMemoryWeeklyScheduleHistoryRepository } from "../../doubles/InMemoryWeeklyScheduleHistoryRepository";
import { InMemoryWeeklyScheduleRepository } from "../../doubles/InMemoryWeeklyScheduleRepository";
import { InMemoryUserRepository } from "../../doubles/InMemoryUserRepository";
import {
  WeeklySchedulePermission,
  createUser,
  createWeeklySchedule,
} from "../../helpers/factories";
import { expectErr, expectOk } from "../../helpers/result";

describe("GetWeeklyScheduleHistoryUseCase", () => {
  async function setup() {
    const history = new InMemoryWeeklyScheduleHistoryRepository();
    const schedules = new InMemoryWeeklyScheduleRepository();
    const users = new InMemoryUserRepository();
    await users.save(
      createUser({
        id: "admin",
        username: "administrator",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.READ_WEEKLY_SCHEDULE_HISTORY }],
      }),
    );
    await schedules.save(createWeeklySchedule({ id: "ws-1", week: 10, year: 2026 }));
    await history.append(
      new WeeklyScheduleHistoryEntry({
        id: "h-1",
        scheduleId: "ws-1",
        week: 10,
        year: 2026,
        fileId: "file-1",
        action: "created",
        by: "admin",
        timestamp: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    const uc = new GetWeeklyScheduleHistoryUseCase(history, schedules, users);
    return { users, uc };
  }

  test("returns history with usernames", async () => {
    const { uc } = await setup();
    const entries = expectOk(await uc.execute("admin", "ws-1"));
    expect(entries).toHaveLength(1);
    expect(entries[0]?.action).toBe("created");
    expect(entries[0]?.byUsername).toBe("administrator");
  });

  test("unauthorized / not found", async () => {
    const { users, uc } = await setup();
    await users.save(createUser({ id: "noperm" }));
    expectErr(await uc.execute("noperm", "ws-1"), "weekly_schedule_not_authorized");
    expectErr(await uc.execute("admin", "missing"), "weekly_schedule_not_found");
  });
});
