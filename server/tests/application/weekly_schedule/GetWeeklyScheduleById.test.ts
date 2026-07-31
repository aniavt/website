import { describe, expect, test } from "bun:test";
import { GetWeeklyScheduleByIdUseCase } from "@application/weekly_schedule/use-cases/GetWeeklyScheduleById";
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

describe("GetWeeklyScheduleByIdUseCase", () => {
  async function seed() {
    const schedules = new InMemoryWeeklyScheduleRepository();
    const files = new InMemoryFileRepository();
    const users = new InMemoryUserRepository();
    await files.save(createFile({ id: "file-1", isPrivate: false }));
    await schedules.save(createWeeklySchedule({ id: "ws-active", fileId: "file-1" }));
    await schedules.save(
      createWeeklySchedule({ id: "ws-deleted", isDeleted: true, fileId: "file-1" }),
    );
    const uc = new GetWeeklyScheduleByIdUseCase(schedules, files, users);
    return { users, uc };
  }

  test("returns active schedule for anonymous user", async () => {
    const { uc } = await seed();
    const dto = expectOk(await uc.execute(null, "ws-active"));
    expect(dto.id).toBe("ws-active");
    expect(dto.fileContentType).toBe("image/png");
  });

  test("anonymous cannot see deleted schedule", async () => {
    const { uc } = await seed();
    expectErr(await uc.execute(null, "ws-deleted"), "weekly_schedule_not_found");
  });

  test("user with delete permission can see deleted schedule", async () => {
    const { users, uc } = await seed();
    await users.save(
      createUser({
        id: "admin",
        grants: [{ type: "weekly_schedule", permission: WeeklySchedulePermission.DELETE_WEEKLY_SCHEDULE }],
      }),
    );
    const dto = expectOk(await uc.execute("admin", "ws-deleted"));
    expect(dto.isDeleted).toBe(true);
  });
});
