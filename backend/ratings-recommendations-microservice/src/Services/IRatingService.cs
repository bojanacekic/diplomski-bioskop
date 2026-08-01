using RatingsRecommendations.Domain;
namespace RatingsRecommendations.Services;
public interface IRatingService { Task<IReadOnlyList<MovieRatingResponseDto>> GetMineAsync(Guid userId, CancellationToken token); Task<MovieRatingResponseDto> SaveAsync(Guid userId, CreateMovieRatingRequestDto request, CancellationToken token); Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken token); }
