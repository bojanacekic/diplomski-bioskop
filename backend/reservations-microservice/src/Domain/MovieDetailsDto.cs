namespace Reservations.Domain;

public sealed class MovieDetailsDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
}
