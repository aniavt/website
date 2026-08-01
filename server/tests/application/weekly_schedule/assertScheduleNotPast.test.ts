import { describe, test } from "bun:test";
import { assertScheduleNotPast } from "@application/weekly_schedule/assertScheduleNotPast";
import { getISOWeekAndYear } from "@ania/date";
import { expectErr, expectOk } from "../../helpers/result";

describe("assertScheduleNotPast", () => {
  const now = new Date("2026-07-15T12:00:00.000Z");
  const { week, year } = getISOWeekAndYear(now);

  test("allows current week", () => {
    expectOk(assertScheduleNotPast({ week, year }, now));
  });

  test("allows future week/year", () => {
    expectOk(assertScheduleNotPast({ week: week + 1, year }, now));
    expectOk(assertScheduleNotPast({ week: 1, year: year + 1 }, now));
  });

  test("rejects past week same year", () => {
    if (week > 1) {
      expectErr(
        assertScheduleNotPast({ week: week - 1, year }, now),
        "weekly_schedule_cannot_modify_past",
      );
    }
  });

  test("rejects past year", () => {
    expectErr(
      assertScheduleNotPast({ week: 52, year: year - 1 }, now),
      "weekly_schedule_cannot_modify_past",
    );
  });
});
