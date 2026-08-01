namespace RatingsRecommendations.Domain;

public sealed class MovieRating
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid MovieId { get; set; }
    public int Score { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
