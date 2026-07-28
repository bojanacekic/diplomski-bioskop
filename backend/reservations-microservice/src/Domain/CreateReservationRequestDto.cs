namespace Reservations.Domain;

public sealed class CreateReservationRequestDto
{
    public Guid ScreeningId { get; init; }
    public string SeatLabel { get; init; } = string.Empty;
}
