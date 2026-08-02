namespace RatingsRecommendations.Domain;

public sealed class MovieRatingAverageResponseDto
{
    public Guid MovieId { get; init; }
    public double AverageRating { get; init; }
    public int RatingCount { get; init; }
}
