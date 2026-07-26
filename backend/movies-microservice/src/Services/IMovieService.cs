using Movies.Domain; namespace Movies.Services; public interface IMovieService { Task<IReadOnlyList<MovieResponseDto>> GetActiveAsync(string? search, CancellationToken token); }
