namespace Movies.Domain;

public sealed class UpdateMovieRequestDto
{
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Genre { get; init; } = string.Empty;
    public int DurationMinutes { get; init; }
    public DateOnly PremiereDate { get; init; }
    public string AgeRating { get; init; } = string.Empty;
    public string? PosterBase64 { get; init; }
}
