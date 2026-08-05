export const UserRole = Object.freeze({ RegisteredUser: 1, CinemaManager: 2, Administrator: 3 });
export const userRoleLabel = (role) => ({
  [UserRole.RegisteredUser]: "Registered user",
  [UserRole.CinemaManager]: "Cinema manager",
  [UserRole.Administrator]: "Administrator",
})[role] ?? "Unknown";
