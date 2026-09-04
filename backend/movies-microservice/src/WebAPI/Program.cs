using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Movies.Database;
using Movies.Domain;
using Movies.Services;
using Movies.WebAPI.Validators;

Movies.Services.DotEnvReader.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connection =
    builder.Configuration.GetConnectionString("MoviesDatabase")
    ?? builder.Configuration["ConnectionStrings__MoviesDatabase"]
    ?? throw new InvalidOperationException("ConnectionStrings__MoviesDatabase is not configured.");

builder.WebHost.UseUrls(
    builder.Configuration["Movies:Url"]
        ?? builder.Configuration["Movies__Url"]
        ?? "http://localhost:5002"
);
var jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? builder.Configuration["Jwt__Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience =
    builder.Configuration["Jwt:Audience"]
    ?? builder.Configuration["Jwt__Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
var jwtSecretKey =
    builder.Configuration["Jwt:SecretKey"]
    ?? builder.Configuration["Jwt__SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
if (jwtSecretKey.Length < 32)
    throw new InvalidOperationException("Jwt:SecretKey must contain at least 32 characters.");
builder.Services.AddDbContext<MoviesDbContext>(options => options.UseSqlServer(connection));
builder.Services.AddScoped<IMovieService, MovieService>();
builder.Services.AddSingleton<IMovieRequestValidator, MovieRequestValidator>();
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
            ValidateLifetime = true,
        }
    );
builder.Services.AddAuthorization(options =>
    options.AddPolicy(
        "MovieManagement",
        policy => policy.RequireRole("CinemaManager", "Administrator")
    )
);
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(builder.Configuration["Cors__AllowedOrigin"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    )
);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<MoviesDbContext>().Database.MigrateAsync();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet(
    "/api/movies",
    async (
        string? search,
        DateOnly? premiereDate,
        MovieStatus? status,
        bool? includeImages,
        IMovieService service,
        CancellationToken token
    ) =>
        Results.Ok(
            await service.GetAsync(
                new MovieSearchRequestDto
                {
                    Search = search,
                    PremiereDate = premiereDate,
                    Status = status,
                    IncludeImages = includeImages ?? true,
                },
                token
            )
        )
);

app.MapGet(
    "/api/movies/{id:guid}/poster",
    async (Guid id, bool? vertical, HttpContext context, IMovieService service, CancellationToken token) =>
    {
        var encodedImage = await service.GetImageAsync(id, vertical ?? false, token);
        if (string.IsNullOrWhiteSpace(encodedImage))
            return Results.NotFound();

        try
        {
            var commaIndex = encodedImage.IndexOf(',');
            var hasDataPrefix = encodedImage.StartsWith("data:", StringComparison.OrdinalIgnoreCase);
            var contentType = hasDataPrefix && commaIndex > 5
                ? encodedImage[5..encodedImage.IndexOf(';')]
                : "image/jpeg";
            var base64 = hasDataPrefix && commaIndex >= 0 ? encodedImage[(commaIndex + 1)..] : encodedImage;
            context.Response.Headers.CacheControl = "public,max-age=86400";
            return Results.File(Convert.FromBase64String(base64), contentType);
        }
        catch (FormatException)
        {
            return Results.NotFound();
        }
    }
);

app.MapGet(
    "/api/movies/{id:guid}",
    async (Guid id, IMovieService service, CancellationToken token) =>
    {
        var movie = await service.GetByIdAsync(id, token);
        return movie is null ? Results.NotFound() : Results.Ok(movie);
    }
);

app.MapPost(
        "/api/movies",
        async (
            CreateMovieRequestDto request,
            IMovieRequestValidator validator,
            IMovieService service,
            CancellationToken token
        ) =>
        {
            var errors = validator.Validate(request);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            var movie = await service.CreateAsync(request, token);
            return Results.Created($"/api/movies/{movie.Id}", movie);
        }
    )
    .RequireAuthorization("MovieManagement");

app.MapPut(
        "/api/movies/{id:guid}",
        async (
            Guid id,
            UpdateMovieRequestDto request,
            IMovieRequestValidator validator,
            IMovieService service,
            CancellationToken token
        ) =>
        {
            var errors = validator.Validate(request);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            var movie = await service.UpdateAsync(id, request, token);
            return movie is null ? Results.NotFound() : Results.Ok(movie);
        }
    )
    .RequireAuthorization("MovieManagement");

app.MapPatch(
        "/api/movies/{id:guid}/status",
        async (
            Guid id,
            ChangeMovieStatusRequestDto request,
            IMovieService service,
            CancellationToken token
        ) =>
        {
            try
            {
                var movie = await service.ChangeStatusAsync(id, request.Status, token);
                return movie is null ? Results.NotFound() : Results.Ok(movie);
            }
            catch (InvalidOperationException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        }
    )
    .RequireAuthorization("MovieManagement");

app.MapDelete(
        "/api/movies/{id:guid}",
        async (Guid id, IMovieService service, CancellationToken token) =>
            await service.WithdrawAsync(id, token) ? Results.NoContent() : Results.NotFound()
    )
    .RequireAuthorization("MovieManagement");

app.Run();
