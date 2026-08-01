namespace RatingsRecommendations.Domain;

public sealed class MovieDetailsDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Genre { get; init; } = string.Empty;
    public decimal AverageRating { get; init; }
    public int Status { get; init; }
}
