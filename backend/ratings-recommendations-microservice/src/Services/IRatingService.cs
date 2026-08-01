using RatingsRecommendations.Domain;
namespace RatingsRecommendations.Services;
public interface IRatingService { Task<IReadOnlyList<MovieRatingResponseDto>> GetMineAsync(Guid userId, CancellationToken token); Task<IReadOnlyList<MovieRecommendationResponseDto>> GetRecommendationsAsync(Guid userId, string authorizationHeader, CancellationToken token); Task<MovieRatingResponseDto> SaveAsync(Guid userId, string authorizationHeader, CreateMovieRatingRequestDto request, CancellationToken token); Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken token); }
