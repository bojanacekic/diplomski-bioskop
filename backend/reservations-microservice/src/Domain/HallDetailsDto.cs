namespace Reservations.Domain;

public sealed class HallDetailsDto
{
    public Guid Id { get; init; }
    public int Rows { get; init; }
    public int SeatsPerRow { get; init; }
    public bool IsActive { get; init; }
}
