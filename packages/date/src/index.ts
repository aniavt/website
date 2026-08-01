/** ISO-8601: week (1–53) and year (week-year, can differ from calendar year at boundaries). */
export function getISOWeekAndYear(date: Date): { week: number; year: number } {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7; // 1=Mon … 7=Sun
    d.setUTCDate(d.getUTCDate() + 4 - day); // Thursday of this week
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return { week, year: d.getUTCFullYear() };
}
