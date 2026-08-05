using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Screenings.Database;
using Screenings.Domain;
using Screenings.Services;
using Screenings.WebAPI.Validators;

DotEnvReader.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
DotEnvReader.Load(
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"))
);
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
var screeningsUrl =
    builder.Configuration["Screenings:Url"]
    ?? builder.Configuration["Screenings__Url"]
    ?? "http://localhost:5004";
builder.WebHost.UseUrls(screeningsUrl);
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? builder.Configuration["Jwt__Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? builder.Configuration["Jwt__Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? builder.Configuration["Jwt__SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
if (jwtSecretKey.Length < 32)
    throw new InvalidOperationException("Jwt:SecretKey must contain at least 32 characters.");
var connection =
    builder.Configuration.GetConnectionString("ScreeningsDatabase")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__ScreeningsDatabase")
    ?? throw new InvalidOperationException(
        "ConnectionStrings__ScreeningsDatabase is not configured."
    );
var gatewayBaseUrl =
    builder.Configuration["Services:GatewayBaseUrl"]
    ?? builder.Configuration["Services__GatewayBaseUrl"]
    ?? "http://localhost:5001";
builder.Services.AddDbContext<ScreeningsDbContext>(o => o.UseSqlServer(connection));
builder.Services.AddScoped<IScreeningService, ScreeningService>();
builder.Services.AddHttpClient("Gateway", client =>
    client.BaseAddress = new Uri($"{gatewayBaseUrl.TrimEnd('/')}/"));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidIssuer = jwtIssuer, ValidateAudience = true, ValidAudience = jwtAudience, ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)), ValidateLifetime = true });
builder.Services.AddAuthorization(options => options.AddPolicy("ScreeningManagement", policy => policy.RequireRole("CinemaManager", "Administrator")));
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p =>
        p.WithOrigins(builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    )
);
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<ScreeningsDbContext>().Database;
    await database.ExecuteSqlRawAsync("""
        IF OBJECT_ID(N'[Screenings]') IS NOT NULL
        BEGIN
            IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
                CREATE TABLE [__EFMigrationsHistory] ([MigrationId] nvarchar(150) NOT NULL PRIMARY KEY, [ProductVersion] nvarchar(32) NOT NULL);
            IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260727212403_InitialCreate')
                INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260727212403_InitialCreate', N'8.0.28');
        END
        """);
    await scope
        .ServiceProvider.GetRequiredService<ScreeningsDbContext>()
        .Database.MigrateAsync();
}
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet(
    "/api/screenings",
    async (DateOnly? date, IScreeningService s, CancellationToken t) =>
        Results.Ok(await s.GetAsync(date, t))
);
app.MapGet(
    "/api/screenings/{id:guid}",
    async (Guid id, IScreeningService s, CancellationToken t) =>
        (await s.GetByIdAsync(id, t)) is { } screening ? Results.Ok(screening) : Results.NotFound()
);
app.MapPost(
    "/api/screenings",
    async (CreateScreeningRequestDto r, IScreeningService s, CancellationToken t) =>
    {
        var e = ScreeningValidator.Validate(r);
        if (e.Count > 0)
            return Results.ValidationProblem(e);
        if (await s.HasOverlapAsync(r.HallId, r.StartsAtUtc, r.EndsAtUtc, null, t))
            return Results.Conflict(
                new { message = "The hall already has a screening in this time slot." }
            );
        var screening = await s.CreateAsync(r, t);
        return Results.Created($"/api/screenings/{screening.Id}", screening);
    }
).RequireAuthorization("ScreeningManagement");
app.MapPut(
    "/api/screenings/{id:guid}",
    async (Guid id, UpdateScreeningRequestDto r, IScreeningService s, CancellationToken t) =>
    {
        var e = ScreeningValidator.Validate(r);
        if (e.Count > 0)
            return Results.ValidationProblem(e);
        if (await s.HasOverlapAsync(r.HallId, r.StartsAtUtc, r.EndsAtUtc, id, t))
            return Results.Conflict(
                new { message = "The hall already has a screening in this time slot." }
            );
        var screening = await s.UpdateAsync(id, r, t);
        return screening is null ? Results.NotFound() : Results.Ok(screening);
    }
).RequireAuthorization("ScreeningManagement");
app.MapDelete(
    "/api/screenings/{id:guid}",
    async (Guid id, HttpRequest request, IHttpClientFactory clients, IScreeningService s, CancellationToken t) =>
    {
        if (await s.GetByIdAsync(id, t) is null)
            return Results.NotFound();

        var gateway = clients.CreateClient("Gateway");
        foreach (var path in new[]
        {
            $"api/tickets/screenings/{id}/cascade-delete",
            $"api/reservations/screenings/{id}/cascade-delete"
        })
        {
            using var cascadeRequest = new HttpRequestMessage(HttpMethod.Put, path);
            cascadeRequest.Headers.TryAddWithoutValidation(
                "Authorization",
                request.Headers.Authorization.ToString()
            );
            using var response = await gateway.SendAsync(cascadeRequest, t);
            if (!response.IsSuccessStatusCode)
            {
                var details = await response.Content.ReadAsStringAsync(t);
                return Results.Conflict(new
                {
                    message = "The screening could not be deleted because related reservations or tickets could not be removed.",
                    details
                });
            }
        }

        return await s.DeleteAsync(id, t) ? Results.NoContent() : Results.NotFound();
    }
).RequireAuthorization("ScreeningManagement");
app.Run();
