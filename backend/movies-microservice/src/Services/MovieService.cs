using Microsoft.EntityFrameworkCore;
using Movies.Database;
using Movies.Domain;

namespace Movies.Services;

public sealed class MovieService(MoviesDbContext db) : IMovieService
{
    public async Task<IReadOnlyList<MovieResponseDto>> GetAsync(
        MovieSearchRequestDto request,
        CancellationToken token
    )
    {
        var query = db.Movies.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(x => x.Title.Contains(search) || x.Genre.Contains(search));
        }

        if (request.PremiereDate.HasValue)
            query = query.Where(x => x.PremiereDate == request.PremiereDate.Value);
        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);
        else
            query = query.Where(x => x.Status != MovieStatus.Withdrawn);

        return await query
            .OrderBy(x => x.PremiereDate)
            .Select(Project(request.IncludeImages))
            .ToListAsync(token);
    }

    public async Task<MovieResponseDto?> GetByIdAsync(Guid id, CancellationToken token) =>
        await db
            .Movies.AsNoTracking()
            .Where(x => x.Id == id)
            .Select(Project(includeImages: true))
            .SingleOrDefaultAsync(token);

    public Task<string?> GetImageAsync(Guid id, bool vertical, CancellationToken token) =>
        db.Movies
            .AsNoTracking()
            .Where(movie => movie.Id == id)
            .Select(movie => vertical ? movie.VerticalPosterBase64 : movie.PosterBase64)
            .SingleOrDefaultAsync(token);

    public async Task<MovieResponseDto> CreateAsync(
        CreateMovieRequestDto request,
        CancellationToken token
    )
    {
        var movie = new Movie
        {
            Id = Guid.NewGuid(),
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Genre = request.Genre.Trim(),
            DurationMinutes = request.DurationMinutes,
            PremiereDate = request.PremiereDate,
            AgeRating = request.AgeRating.Trim(),
            PosterBase64 = request.PosterBase64,
            VerticalPosterBase64 = request.VerticalPosterBase64,
            TrailerUrl = NormalizeOptional(request.TrailerUrl),
            Status = request.Status,
            AverageRating = 0,
        };

        db.Movies.Add(movie);
        await db.SaveChangesAsync(token);
        return Map(movie);
    }

    public async Task<MovieResponseDto?> UpdateAsync(
        Guid id,
        UpdateMovieRequestDto request,
        CancellationToken token
    )
    {
        var movie = await db.Movies.SingleOrDefaultAsync(x => x.Id == id, token);
        if (movie is null)
            return null;

        movie.Title = request.Title.Trim();
        movie.Description = request.Description.Trim();
        movie.Genre = request.Genre.Trim();
        movie.DurationMinutes = request.DurationMinutes;
        movie.PremiereDate = request.PremiereDate;
        movie.AgeRating = request.AgeRating.Trim();
        movie.PosterBase64 = request.PosterBase64;
        movie.VerticalPosterBase64 = request.VerticalPosterBase64;
        movie.TrailerUrl = NormalizeOptional(request.TrailerUrl);

        await db.SaveChangesAsync(token);
        return Map(movie);
    }

    public async Task<MovieResponseDto?> ChangeStatusAsync(
        Guid id,
        MovieStatus status,
        CancellationToken token
    )
    {
        var movie = await db.Movies.SingleOrDefaultAsync(x => x.Id == id, token);
        if (movie is null)
            return null;
        if (!MovieStatusTransitionRules.CanTransition(movie.Status, status))
            throw new InvalidOperationException(
                $"A movie cannot transition from {movie.Status} to {status}."
            );

        movie.Status = status;
        await db.SaveChangesAsync(token);
        return Map(movie);
    }

    public async Task<bool> WithdrawAsync(Guid id, CancellationToken token)
    {
        var movie = await db.Movies.SingleOrDefaultAsync(x => x.Id == id, token);
        if (movie is null)
            return false;
        if (movie.Status == MovieStatus.Withdrawn)
            return true;

        movie.Status = MovieStatus.Withdrawn;
        await db.SaveChangesAsync(token);
        return true;
    }

    private static System.Linq.Expressions.Expression<Func<Movie, MovieResponseDto>> Project(
        bool includeImages
    ) =>
        movie => new MovieResponseDto
        {
            Id = movie.Id,
            Title = movie.Title,
            Description = movie.Description,
            Genre = movie.Genre,
            DurationMinutes = movie.DurationMinutes,
            PremiereDate = movie.PremiereDate,
            AgeRating = movie.AgeRating,
            PosterBase64 = includeImages ? movie.PosterBase64 : null,
            VerticalPosterBase64 = includeImages ? movie.VerticalPosterBase64 : null,
            TrailerUrl = movie.TrailerUrl,
            AverageRating = movie.AverageRating,
            Status = movie.Status,
        };

    private static MovieResponseDto Map(Movie movie) =>
        new()
        {
            Id = movie.Id,
            Title = movie.Title,
            Description = movie.Description,
            Genre = movie.Genre,
            DurationMinutes = movie.DurationMinutes,
            PremiereDate = movie.PremiereDate,
            AgeRating = movie.AgeRating,
            PosterBase64 = movie.PosterBase64,
            VerticalPosterBase64 = movie.VerticalPosterBase64,
            TrailerUrl = movie.TrailerUrl,
            AverageRating = movie.AverageRating,
            Status = movie.Status,
        };

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
