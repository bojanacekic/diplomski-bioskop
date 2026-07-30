namespace TicketPurchases.Domain;

public sealed class TicketPdfDataDto
{
    public string TicketNumber { get; init; } = string.Empty;
    public string MovieTitle { get; init; } = string.Empty;
    public string HallName { get; init; } = string.Empty;
    public string SeatLabel { get; init; } = string.Empty;
    public DateTime StartsAtUtc { get; init; }
    public decimal PricePaid { get; init; }
}
