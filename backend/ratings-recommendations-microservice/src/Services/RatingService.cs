using Microsoft.EntityFrameworkCore;
using RatingsRecommendations.Database;
using RatingsRecommendations.Domain;
using System.Net.Http.Headers;
using System.Net.Http.Json;
namespace RatingsRecommendations.Services;
public sealed class RatingService(RatingsRecommendationsDbContext db, IHttpClientFactory httpClientFactory) : IRatingService
{
 public async Task<IReadOnlyList<MovieRatingResponseDto>> GetMineAsync(Guid userId, CancellationToken token) => await db.MovieRatings.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.UpdatedAtUtc).Select(x => Map(x)).ToListAsync(token);
 public async Task<MovieRatingResponseDto> SaveAsync(Guid userId, string authorizationHeader, CreateMovieRatingRequestDto request, CancellationToken token) { if (!await HasPurchasedMovieAsync(authorizationHeader, request.MovieId, token)) throw new InvalidOperationException("You can rate a movie only after purchasing a ticket for it."); var rating = await db.MovieRatings.SingleOrDefaultAsync(x => x.UserId == userId && x.MovieId == request.MovieId, token); var now = DateTime.UtcNow; if (rating is null) { rating = new MovieRating { Id = Guid.NewGuid(), UserId = userId, MovieId = request.MovieId, Score = request.Score, CreatedAtUtc = now, UpdatedAtUtc = now }; db.MovieRatings.Add(rating); } else { rating.Score = request.Score; rating.UpdatedAtUtc = now; } await db.SaveChangesAsync(token); return Map(rating); }
 public async Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken token) { var rating = await db.MovieRatings.SingleOrDefaultAsync(x => x.Id == id && x.UserId == userId, token); if (rating is null) return false; db.MovieRatings.Remove(rating); await db.SaveChangesAsync(token); return true; }
 private static MovieRatingResponseDto Map(MovieRating x) => new() { Id = x.Id, MovieId = x.MovieId, Score = x.Score, UpdatedAtUtc = x.UpdatedAtUtc };
 private async Task<bool> HasPurchasedMovieAsync(string authorizationHeader, Guid movieId, CancellationToken token) { var client = httpClientFactory.CreateClient("Gateway"); using var request = new HttpRequestMessage(HttpMethod.Get, "api/tickets/me"); request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader); using var response = await client.SendAsync(request, token); if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Ticket information is temporarily unavailable."); var tickets = await response.Content.ReadFromJsonAsync<List<TicketDetailsDto>>(cancellationToken: token) ?? []; foreach (var ticket in tickets.Where(x => x.Status is 1 or 2)) { var screening = await client.GetFromJsonAsync<ScreeningDetailsDto>($"api/screenings/{ticket.ScreeningId}", token); if (screening?.MovieId == movieId) return true; } return false; }
}
