export const ScreeningStatus = Object.freeze({ Scheduled: 0, Active: 1, Completed: 2, Cancelled: 3 });
export const screeningStatusLabel = (status) => ["SCHEDULED", "ACTIVE", "COMPLETED", "CANCELLED"][status] ?? "UNKNOWN";
