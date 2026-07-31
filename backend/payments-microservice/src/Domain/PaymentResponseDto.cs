namespace Payments.Domain;

public sealed class PaymentResponseDto
{
    public Guid Id { get; init; }
    public Guid ReservationId { get; init; }
    public decimal Amount { get; init; }
    public string CardLastFour { get; init; } = string.Empty;
    public PaymentStatus Status { get; init; }
    public string? FailureReason { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? CapturedAtUtc { get; init; }
    public DateTime? VoidedAtUtc { get; init; }
}
