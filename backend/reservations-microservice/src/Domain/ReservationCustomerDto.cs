namespace Reservations.Domain;

public sealed class ReservationCustomerDto
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}
