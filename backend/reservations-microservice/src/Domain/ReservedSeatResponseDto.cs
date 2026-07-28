namespace Reservations.Domain;

public sealed class ReservedSeatResponseDto
{
    public string SeatLabel { get; init; } = string.Empty;
    public bool IsMine { get; init; }
}
