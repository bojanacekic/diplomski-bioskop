namespace Reservations.Domain;

public sealed class Reservation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ScreeningId { get; set; }
    public string SeatLabel { get; set; } = string.Empty;
    public ReservationStatus Status { get; set; } = ReservationStatus.Active;
    public ReservationPaymentOption PaymentOption { get; set; } = ReservationPaymentOption.NotSelected;
    public DateTime ReservedAtUtc { get; set; }
    public DateTime? CancelledAtUtc { get; set; }
    public DateTime? ExpiredAtUtc { get; set; }
}
