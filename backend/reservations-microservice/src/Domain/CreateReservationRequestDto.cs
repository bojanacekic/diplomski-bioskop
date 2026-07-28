namespace Reservations.Domain;

public sealed class CreateReservationRequestDto
{
    public Guid ScreeningId { get; init; }
    public IReadOnlyList<string> SeatLabels { get; init; } = [];
}
