import { describe, expect, test } from "bun:test";
import { WeeklySchedule } from "@domain/entities/WeeklySchedule";

function schedule(week: number): WeeklySchedule {
  return new WeeklySchedule({
    id: "ws",
    week,
    year: 2026,
    fileId: "f",
    isDeleted: false,
    title: "t",
    description: "",
    tags: [],
  });
}

describe("WeeklySchedule.isWeekValid", () => {
  test.each([1, 26, 53])("week %i valid", (week) => {
    expect(schedule(week).isWeekValid()).toBe(true);
  });

  test.each([0, -1, 54, 100])("week %i invalid", (week) => {
    expect(schedule(week).isWeekValid()).toBe(false);
  });
});
