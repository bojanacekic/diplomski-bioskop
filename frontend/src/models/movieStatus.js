export const MovieStatus = Object.freeze({
  Upcoming: 0,
  Active: 1,
  Withdrawn: 2,
});
export const movieStatusLabel = (status) =>
  ["Upcoming", "Active", "Withdrawn"][status] ?? "Unknown";
