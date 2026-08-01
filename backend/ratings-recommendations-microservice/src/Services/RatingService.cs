using Microsoft.EntityFrameworkCore;
using RatingsRecommendations.Database;
using RatingsRecommendations.Domain;
using System.Net.Http.Headers;
using System.Net.Http.Json;
namespace RatingsRecommendations.Services;
public sealed class RatingService(RatingsRecommendationsDbContext db, IHttpClientFactory httpClientFactory) : IRatingService
{
 public async Task<IReadOnlyList<MovieRatingResponseDto>> GetMineAsync(Guid userId, CancellationToken token) => await db.MovieRatings.AsNoTracking().Where(x => x.UserId == userId).OrderByDescending(x => x.UpdatedAtUtc).Select(x => Map(x)).ToListAsync(token);
 public async Task<IReadOnlyList<MovieRecommendationResponseDto>> GetRecommendationsAsync(Guid userId, string authorizationHeader, CancellationToken token)
 {
  var client = httpClientFactory.CreateClient("Gateway");
  var ticketsTask = GetAuthorizedAsync<List<TicketDetailsDto>>(client, "api/tickets/me", authorizationHeader, token);
  var screeningsTask = client.GetFromJsonAsync<List<ScreeningDetailsDto>>("api/screenings", token);
  var moviesTask = client.GetFromJsonAsync<List<MovieDetailsDto>>("api/movies?includeImages=false", token);
  var ratingsTask = db.MovieRatings.AsNoTracking().ToListAsync(token);
  await Task.WhenAll(ticketsTask, screeningsTask, moviesTask, ratingsTask);

  var screenings = (await screeningsTask ?? []).ToDictionary(x => x.Id);
  var watchedMovieIds = (await ticketsTask ?? []).Where(x => x.Status is 1 or 2).Select(x => screenings.GetValueOrDefault(x.ScreeningId)?.MovieId).Where(x => x.HasValue).Select(x => x!.Value).ToHashSet();
  var movies = await moviesTask ?? [];
  var movieById = movies.ToDictionary(x => x.Id);
  var genreScores = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
  foreach (var movieId in watchedMovieIds)
   if (movieById.TryGetValue(movieId, out var watched)) genreScores[watched.Genre] = genreScores.GetValueOrDefault(watched.Genre) + 1;
  var allRatings = await ratingsTask;
  foreach (var rating in allRatings.Where(x => x.UserId == userId))
   if (movieById.TryGetValue(rating.MovieId, out var rated)) genreScores[rated.Genre] = genreScores.GetValueOrDefault(rated.Genre) + Math.Max(0, rating.Score - 2) * 2;
  var audienceScores = allRatings.GroupBy(x => x.MovieId).ToDictionary(x => x.Key, x => (decimal)x.Average(rating => rating.Score));

  return movies.Where(x => x.Status == 1 && !watchedMovieIds.Contains(x.Id))
   .Select(x => new MovieRecommendationResponseDto { MovieId = x.Id, Score = genreScores.GetValueOrDefault(x.Genre) * 10 + audienceScores.GetValueOrDefault(x.Id, x.AverageRating), Reason = genreScores.ContainsKey(x.Genre) ? $"Because you enjoy {x.Genre} films" : "Popular with Smart Cinema viewers" })
   .OrderByDescending(x => x.Score).ThenBy(x => movieById[x.MovieId].Title).Take(3).ToList();
 }
 public async Task<MovieRatingResponseDto> SaveAsync(Guid userId, string authorizationHeader, CreateMovieRatingRequestDto request, CancellationToken token) { if (!await HasPurchasedMovieAsync(authorizationHeader, request.MovieId, token)) throw new InvalidOperationException("You can rate a movie only after purchasing a ticket for it."); var rating = await db.MovieRatings.SingleOrDefaultAsync(x => x.UserId == userId && x.MovieId == request.MovieId, token); var now = DateTime.UtcNow; if (rating is null) { rating = new MovieRating { Id = Guid.NewGuid(), UserId = userId, MovieId = request.MovieId, Score = request.Score, CreatedAtUtc = now, UpdatedAtUtc = now }; db.MovieRatings.Add(rating); } else { rating.Score = request.Score; rating.UpdatedAtUtc = now; } await db.SaveChangesAsync(token); return Map(rating); }
 public async Task<bool> DeleteAsync(Guid id, Guid userId, CancellationToken token) { var rating = await db.MovieRatings.SingleOrDefaultAsync(x => x.Id == id && x.UserId == userId, token); if (rating is null) return false; db.MovieRatings.Remove(rating); await db.SaveChangesAsync(token); return true; }
 private static MovieRatingResponseDto Map(MovieRating x) => new() { Id = x.Id, MovieId = x.MovieId, Score = x.Score, UpdatedAtUtc = x.UpdatedAtUtc };
 private async Task<bool> HasPurchasedMovieAsync(string authorizationHeader, Guid movieId, CancellationToken token) { var client = httpClientFactory.CreateClient("Gateway"); using var request = new HttpRequestMessage(HttpMethod.Get, "api/tickets/me"); request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader); using var response = await client.SendAsync(request, token); if (!response.IsSuccessStatusCode) throw new InvalidOperationException("Ticket information is temporarily unavailable."); var tickets = await response.Content.ReadFromJsonAsync<List<TicketDetailsDto>>(cancellationToken: token) ?? []; foreach (var ticket in tickets.Where(x => x.Status is 1 or 2)) { var screening = await client.GetFromJsonAsync<ScreeningDetailsDto>($"api/screenings/{ticket.ScreeningId}", token); if (screening?.MovieId == movieId) return true; } return false; }
 private static async Task<T?> GetAuthorizedAsync<T>(HttpClient client, string path, string authorizationHeader, CancellationToken token) { using var request = new HttpRequestMessage(HttpMethod.Get, path); request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader); using var response = await client.SendAsync(request, token); response.EnsureSuccessStatusCode(); return await response.Content.ReadFromJsonAsync<T>(cancellationToken: token); }
}
