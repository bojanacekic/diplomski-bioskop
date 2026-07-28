using Halls.Domain;

namespace Halls.Services;

public interface IHallService
{
    Task<IReadOnlyList<HallResponseDto>> GetAsync(string? search, CancellationToken token);
    Task<HallResponseDto?> GetByIdAsync(Guid id, CancellationToken token);
    Task<HallResponseDto?> UpdateAsync(
        Guid id,
        UpdateHallRequestDto request,
        CancellationToken token
    );
    Task<bool> DeleteAsync(Guid id, CancellationToken token);
    Task<HallResponseDto> CreateAsync(CreateHallRequestDto request, CancellationToken token);
}
