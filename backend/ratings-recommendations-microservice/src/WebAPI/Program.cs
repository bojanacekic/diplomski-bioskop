using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RatingsRecommendations.Database;
using RatingsRecommendations.Domain;
using RatingsRecommendations.Services;

var environmentDirectory = new DirectoryInfo(Directory.GetCurrentDirectory());
while (environmentDirectory is not null && !File.Exists(Path.Combine(environmentDirectory.FullName, ".env")))
    environmentDirectory = environmentDirectory.Parent;
if (environmentDirectory is not null)
    DotEnvReader.Load(Path.Combine(environmentDirectory.FullName, ".env"));
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
var connection = builder.Configuration.GetConnectionString("RatingsRecommendationsDatabase") ?? throw new InvalidOperationException("Ratings recommendations database is not configured.");
var issuer = builder.Configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt issuer is not configured.");
var audience = builder.Configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt audience is not configured.");
var secret = builder.Configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt secret is not configured.");
builder.WebHost.UseUrls(builder.Configuration["RatingsRecommendations:Url"] ?? "http://localhost:5008");
builder.Services.AddDbContext<RatingsRecommendationsDbContext>(x => x.UseSqlServer(connection));
builder.Services.AddScoped<IRatingService, RatingService>();
builder.Services.AddHttpClient("Gateway", client => client.BaseAddress = new Uri((builder.Configuration["Services:GatewayBaseUrl"] ?? "http://localhost:5001").TrimEnd('/') + "/"));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(x => x.TokenValidationParameters = new() { ValidateIssuer = true, ValidIssuer = issuer, ValidateAudience = true, ValidAudience = audience, ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)), ValidateLifetime = true });
builder.Services.AddAuthorization();
builder.Services.AddCors(x => x.AddDefaultPolicy(p => p.WithOrigins(builder.Configuration["Cors__AllowedOrigin"] ?? "http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
using (var scope = app.Services.CreateScope()) await scope.ServiceProvider.GetRequiredService<RatingsRecommendationsDbContext>().Database.MigrateAsync();
app.UseCors(); app.UseAuthentication(); app.UseAuthorization();
Guid UserId(ClaimsPrincipal user) { var value = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub); return Guid.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException(); }
app.MapGet("/api/ratings/me", (ClaimsPrincipal user, IRatingService service, CancellationToken token) => service.GetMineAsync(UserId(user), token)).RequireAuthorization();
app.MapGet("/api/recommendations/me", (HttpRequest request, ClaimsPrincipal user, IRatingService service, CancellationToken token) => service.GetRecommendationsAsync(UserId(user), request.Headers.Authorization.ToString(), token)).RequireAuthorization();
app.MapPost("/api/ratings", async (CreateMovieRatingRequestDto request, HttpRequest httpRequest, ClaimsPrincipal user, IRatingService service, CancellationToken token) => { if (request.MovieId == Guid.Empty || request.Score is < 1 or > 5) return Results.ValidationProblem(new Dictionary<string, string[]> { ["rating"] = ["Movie and a score from 1 to 5 are required."] }); try { return Results.Ok(await service.SaveAsync(UserId(user), httpRequest.Headers.Authorization.ToString(), request, token)); } catch (InvalidOperationException exception) { return Results.Conflict(new { message = exception.Message }); } }).RequireAuthorization();
app.MapDelete("/api/ratings/{id:guid}", async (Guid id, ClaimsPrincipal user, IRatingService service, CancellationToken token) => await service.DeleteAsync(id, UserId(user), token) ? Results.NoContent() : Results.NotFound()).RequireAuthorization();
app.Run();
