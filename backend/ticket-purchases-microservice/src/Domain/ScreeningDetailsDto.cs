namespace TicketPurchases.Domain;

public sealed class ScreeningDetailsDto
{
    public Guid Id { get; init; }
    public Guid MovieId { get; init; }
    public Guid HallId { get; init; }
    public DateTime StartsAtUtc { get; init; }
    public decimal BaseTicketPrice { get; init; }
    public int Status { get; init; }
}
