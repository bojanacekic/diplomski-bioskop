namespace TicketPurchases.Domain;

public sealed class TicketPurchaseResponseDto
{
    public Guid Id { get; init; }
    public Guid ReservationId { get; init; }
    public Guid ScreeningId { get; init; }
    public string TicketNumber { get; init; } = string.Empty;
    public decimal PricePaid { get; init; }
    public DateTime PurchasedAtUtc { get; init; }
}
