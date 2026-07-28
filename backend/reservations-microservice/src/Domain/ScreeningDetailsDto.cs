namespace Reservations.Domain;

public sealed class ScreeningDetailsDto
{
    public Guid Id { get; init; }
    public Guid HallId { get; init; }
    public DateTime StartsAtUtc { get; init; }
    public int Status { get; init; }
}
