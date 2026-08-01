namespace RatingsRecommendations.Domain;

public sealed class MovieRecommendationResponseDto
{
    public Guid MovieId { get; init; }
    public string Reason { get; init; } = string.Empty;
    public decimal Score { get; init; }
}
