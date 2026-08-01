using Microsoft.EntityFrameworkCore;
using RatingsRecommendations.Database;
using RatingsRecommendations.Domain;
namespace RatingsRecommendations.Services;
public sealed class RatingService(RatingsRecommendationsDbContext db) : IRatingService
{
 public async Task<IReadOnlyList<MovieRatingResponseDto>> GetMineAsync(Guid userId, CancellationToken token) => await db.MovieRatings.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.UpdatedAtUtc).Select(x => Map(x)).ToListAsync(token);
 public async Task<MovieRatingResponseDto> SaveAsync(Guid userId, CreateMovieRatingRequestDto request, CancellationToken token) { var rating = await db.MovieRatings.SingleOrDefaultAsync(x => x.UserId == userId && x.MovieId == request.MovieId, token); var now = DateTime.UtcNow; if (rating is null) { rating = new MovieRating { Id = Guid.NewGuid(), UserId = userId, MovieId = request.MovieId, Score = request.Score, CreatedAtUtc = now, UpdatedAtUtc = now }; db.MovieRatings.Add(rating); } else { rating.Score = request.Score; rating.UpdatedAtUtc = now; } await db.SaveChangesAsync(token); return Map(rating); }
 public async Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken token) { var rating = await db.MovieRatings.SingleOrDefaultAsync(x => x.Id == id && x.UserId == userId, token); if (rating is null) return false; db.MovieRatings.Remove(rating); await db.SaveChangesAsync(token); return true; }
 private static MovieRatingResponseDto Map(MovieRating x) => new() { Id = x.Id, MovieId = x.MovieId, Score = x.Score, UpdatedAtUtc = x.UpdatedAtUtc };
}
