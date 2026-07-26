using Movies.Domain;

namespace Movies.Services;

public interface IMovieService
{
    Task<IReadOnlyList<MovieResponseDto>> GetAsync(MovieSearchRequestDto request, CancellationToken token);
    Task<MovieResponseDto?> GetByIdAsync(Guid id, CancellationToken token);
    Task<MovieResponseDto> CreateAsync(CreateMovieRequestDto request, CancellationToken token);
    Task<MovieResponseDto?> UpdateAsync(Guid id, UpdateMovieRequestDto request, CancellationToken token);
    Task<MovieResponseDto?> ChangeStatusAsync(Guid id, MovieStatus status, CancellationToken token);
    Task<bool> WithdrawAsync(Guid id, CancellationToken token);
}
