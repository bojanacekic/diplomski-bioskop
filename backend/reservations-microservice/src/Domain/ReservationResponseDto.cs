namespace Reservations.Domain;

public sealed class ReservationResponseDto
{
    public Guid Id { get; init; }
    public Guid? ReservationGroupId { get; init; }
    public Guid UserId { get; init; }
    public Guid ScreeningId { get; init; }
    public string SeatLabel { get; init; } = string.Empty;
    public ReservationStatus Status { get; init; }
    public ReservationPaymentOption PaymentOption { get; init; }
    public DateTime ReservedAtUtc { get; init; }
    public DateTime? CancelledAtUtc { get; init; }
    public DateTime? ExpiredAtUtc { get; init; }
}
