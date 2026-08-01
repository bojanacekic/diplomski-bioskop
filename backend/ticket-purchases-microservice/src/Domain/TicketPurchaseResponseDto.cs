namespace TicketPurchases.Domain;

public sealed class TicketPurchaseResponseDto
{
    public Guid Id { get; init; }
    public Guid? PurchaseId { get; init; }
    public Guid ReservationId { get; init; }
    public Guid ScreeningId { get; init; }
    public Guid? PaymentId { get; init; }
    public PaymentMethod PaymentMethod { get; init; }
    public TicketStatus Status { get; init; }
    public string SeatLabel { get; init; } = string.Empty;
    public string TicketNumber { get; init; } = string.Empty;
    public decimal PricePaid { get; init; }
    public DateTime PurchasedAtUtc { get; init; }
}
