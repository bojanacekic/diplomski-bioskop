using Microsoft.EntityFrameworkCore;
using Movies.Database;
using Movies.Domain;
using Movies.Services;

Movies.Services.DotEnvReader.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var connection = builder.Configuration.GetConnectionString("MoviesDatabase")
    ?? builder.Configuration["ConnectionStrings__MoviesDatabase"]
    ?? throw new InvalidOperationException("ConnectionStrings__MoviesDatabase is not configured.");

builder.WebHost.UseUrls(builder.Configuration["Movies__Url"] ?? "http://localhost:5002");
builder.Services.AddDbContext<MoviesDbContext>(options => options.UseSqlServer(connection));
builder.Services.AddScoped<IMovieService, MovieService>();
builder.Services.AddSingleton<IMovieRequestValidator, MovieRequestValidator>();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(builder.Configuration["Cors__AllowedOrigin"] ?? "http://localhost:5173")
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<MoviesDbContext>().Database.MigrateAsync();
}

app.UseCors();

app.MapGet("/api/movies", async (string? search, DateOnly? premiereDate, MovieStatus? status, IMovieService service, CancellationToken token) =>
    Results.Ok(await service.GetAsync(new MovieSearchRequestDto { Search = search, PremiereDate = premiereDate, Status = status }, token)));

app.MapGet("/api/movies/{id:guid}", async (Guid id, IMovieService service, CancellationToken token) =>
{
    var movie = await service.GetByIdAsync(id, token);
    return movie is null ? Results.NotFound() : Results.Ok(movie);
});

app.MapPost("/api/movies", async (CreateMovieRequestDto request, IMovieRequestValidator validator, IMovieService service, CancellationToken token) =>
{
    var errors = validator.Validate(request);
    if (errors.Count > 0) return Results.ValidationProblem(errors);

    var movie = await service.CreateAsync(request, token);
    return Results.Created($"/api/movies/{movie.Id}", movie);
});

app.MapPut("/api/movies/{id:guid}", async (Guid id, UpdateMovieRequestDto request, IMovieRequestValidator validator, IMovieService service, CancellationToken token) =>
{
    var errors = validator.Validate(request);
    if (errors.Count > 0) return Results.ValidationProblem(errors);

    var movie = await service.UpdateAsync(id, request, token);
    return movie is null ? Results.NotFound() : Results.Ok(movie);
});

app.MapPatch("/api/movies/{id:guid}/status", async (Guid id, ChangeMovieStatusRequestDto request, IMovieService service, CancellationToken token) =>
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
});

app.MapDelete("/api/movies/{id:guid}", async (Guid id, IMovieService service, CancellationToken token) =>
    await service.WithdrawAsync(id, token) ? Results.NoContent() : Results.NotFound());

app.Run();
