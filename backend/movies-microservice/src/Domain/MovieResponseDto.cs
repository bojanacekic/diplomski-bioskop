namespace Movies.Domain;

public sealed class MovieResponseDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Genre { get; init; } = string.Empty;
    public int DurationMinutes { get; init; }
    public DateOnly PremiereDate { get; init; }
    public string AgeRating { get; init; } = string.Empty;
    public string? PosterBase64 { get; init; }
    public decimal AverageRating { get; init; }
    public MovieStatus Status { get; init; }
}
