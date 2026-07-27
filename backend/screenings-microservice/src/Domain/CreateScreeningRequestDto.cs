namespace Screenings.Domain;

public sealed class CreateScreeningRequestDto
{
    public Guid MovieId { get; init; }
    public Guid HallId { get; init; }
    public DateTime StartsAtUtc { get; init; }
    public DateTime EndsAtUtc { get; init; }
    public decimal BaseTicketPrice { get; init; }
}
