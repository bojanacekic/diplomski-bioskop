namespace Payments.Domain;

public sealed class Payment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ReservationId { get; set; }
    public decimal Amount { get; set; }
    public string CardLastFour { get; set; } = string.Empty;
    public PaymentStatus Status { get; set; }
    public string? FailureReason { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CapturedAtUtc { get; set; }
    public DateTime? VoidedAtUtc { get; set; }
}
