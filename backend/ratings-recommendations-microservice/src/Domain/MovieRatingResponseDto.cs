namespace RatingsRecommendations.Domain;
public sealed class MovieRatingResponseDto { public Guid Id { get; init; } public Guid MovieId { get; init; } public int Score { get; init; } public DateTime UpdatedAtUtc { get; init; } }
