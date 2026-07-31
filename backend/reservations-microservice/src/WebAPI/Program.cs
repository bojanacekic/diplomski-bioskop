using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Reservations.Database;
using Reservations.Domain;
using Reservations.Services;
using Reservations.WebAPI;
using Reservations.WebAPI.Validators;

DotEnvReader.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
DotEnvReader.Load(
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"))
);

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var reservationsUrl =
    builder.Configuration["Reservations:Url"]
    ?? builder.Configuration["Reservations__Url"]
    ?? "http://localhost:5005";
var connectionString =
    builder.Configuration.GetConnectionString("ReservationsDatabase")
    ?? builder.Configuration["ConnectionStrings__ReservationsDatabase"]
    ?? throw new InvalidOperationException("Reservations database is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? builder.Configuration["Jwt__Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? builder.Configuration["Jwt__Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
var jwtSecret = builder.Configuration["Jwt:SecretKey"] ?? builder.Configuration["Jwt__SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
var gatewayBaseUrl =
    builder.Configuration["Services:GatewayBaseUrl"]
    ?? builder.Configuration["Services__GatewayBaseUrl"]
    ?? throw new InvalidOperationException("Services:GatewayBaseUrl is not configured.");

builder.WebHost.UseUrls(reservationsUrl);
builder.Services.AddDbContext<ReservationsDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddHostedService<ReservationExpirationHostedService>();
builder.Services.AddHttpClient("Gateway", client =>
    client.BaseAddress = new Uri($"{gatewayBaseUrl.TrimEnd('/')}/"));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateLifetime = true,
    };
});
builder.Services.AddAuthorization(options =>
    options.AddPolicy(
        "ReservationManagement",
        policy => policy.RequireRole("CinemaManager", "Administrator")
    )
);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<ReservationsDbContext>().Database.MigrateAsync();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

Guid CurrentUserId(ClaimsPrincipal user)
{
    return TryCurrentUserId(user) ?? throw new UnauthorizedAccessException();
}

Guid? TryCurrentUserId(ClaimsPrincipal user)
{
    var userId = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
    return Guid.TryParse(userId, out var id) ? id : null;
}

bool CanManageReservations(ClaimsPrincipal user) =>
    user.IsInRole("CinemaManager") || user.IsInRole("Administrator");

app.MapGet("/api/reservations/me", async (ClaimsPrincipal user, IReservationService service, CancellationToken token) =>
    Results.Ok(await service.GetForUserAsync(CurrentUserId(user), token))).RequireAuthorization();

app.MapGet("/api/reservations", async (Guid? screeningId, IReservationService service, CancellationToken token) =>
    Results.Ok(await service.GetAllAsync(screeningId, token))).RequireAuthorization("ReservationManagement");

app.MapGet("/api/reservations/screenings/{screeningId:guid}/seats", async (Guid screeningId, ClaimsPrincipal user, IReservationService service, CancellationToken token) =>
    Results.Ok(await service.GetReservedSeatsAsync(screeningId, TryCurrentUserId(user), token)));

app.MapPost("/api/reservations", async (CreateReservationRequestDto request, ClaimsPrincipal user, IReservationService service, CancellationToken token) =>
{
    var errors = ReservationValidator.Validate(request);
    if (errors.Count > 0)
        return Results.ValidationProblem(errors);
    try
    {
        var reservations = await service.CreateAsync(CurrentUserId(user), request, token);
        return Results.Created("/api/reservations", reservations);
    }
    catch (InvalidOperationException exception)
    {
        return Results.Conflict(new { message = exception.Message });
    }
}).RequireAuthorization();

app.MapDelete(
        "/api/reservations/{id:guid}",
        async (
            Guid id,
            HttpRequest httpRequest,
            ClaimsPrincipal user,
            IReservationService service,
            CancellationToken token
        ) =>
        {
            try
            {
                return await service.CancelAsync(
                    id,
                    CurrentUserId(user),
                    httpRequest.Headers.Authorization.ToString(),
                    token
                )
                    ? Results.NoContent()
                    : Results.NotFound();
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }
    )
    .RequireAuthorization();

app.MapPut(
        "/api/reservations/{id:guid}/cash-payment",
        async (
            Guid id,
            HttpRequest httpRequest,
            ClaimsPrincipal user,
            IReservationService service,
            CancellationToken token
        ) =>
        {
            try
            {
                var reservation = await service.RequestCashPaymentAsync(
                    id,
                    CurrentUserId(user),
                    httpRequest.Headers.Authorization.ToString(),
                    token
                );
                return reservation is null ? Results.NotFound() : Results.Ok(reservation);
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }
    )
    .RequireAuthorization();

app.MapPut(
        "/api/reservations/{id:guid}/confirm",
        async (
            Guid id,
            ClaimsPrincipal user,
            IReservationService service,
            CancellationToken token
        ) =>
            await service.ConfirmAsync(
                id,
                CurrentUserId(user),
                CanManageReservations(user),
                token
            )
                ? Results.NoContent()
                : Results.Conflict(new { message = "The reservation cannot be confirmed." })
    )
    .RequireAuthorization();

app.Run();
