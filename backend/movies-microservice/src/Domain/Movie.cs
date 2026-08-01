namespace Movies.Domain;

public sealed class Movie
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public DateOnly PremiereDate { get; set; }
    public string AgeRating { get; set; } = string.Empty;
    public string? PosterBase64 { get; set; }
    public string? VerticalPosterBase64 { get; set; }
    public decimal AverageRating { get; set; }
    public MovieStatus Status { get; set; }
}
