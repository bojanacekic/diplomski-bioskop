namespace TicketPurchases.Domain;

public sealed class ReservationDetailsDto
{
    public Guid Id { get; init; }
    public Guid ScreeningId { get; init; }
    public int Status { get; init; }
}
