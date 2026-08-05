export const ReservationStatus = Object.freeze({ Active: 1, Confirmed: 2, Cancelled: 3, Expired: 4 });
export const reservationStatusLabel = (status) => ({
  [ReservationStatus.Active]: "ACTIVE",
  [ReservationStatus.Confirmed]: "CONFIRMED",
  [ReservationStatus.Cancelled]: "CANCELLED",
  [ReservationStatus.Expired]: "EXPIRED",
})[status] ?? "UNKNOWN";
export const ReservationPaymentOption = Object.freeze({ Online: 0, CashAtBoxOffice: 1 });
