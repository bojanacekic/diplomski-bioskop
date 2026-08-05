export const HallType = Object.freeze({ Standard: 0, Premium: 1, Imax: 2, ThreeD: 3 });
export const hallTypeLabel = (type) => ["Standard", "Premium", "IMAX", "3D"][type] ?? "Unknown";
