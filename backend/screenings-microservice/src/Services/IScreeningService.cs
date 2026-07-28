using Screenings.Domain;

namespace Screenings.Services;

public interface IScreeningService
{
    Task<IReadOnlyList<ScreeningResponseDto>> GetAsync(DateOnly? date, CancellationToken token);
    Task<ScreeningResponseDto?> GetByIdAsync(Guid id, CancellationToken token);
    Task<ScreeningResponseDto> CreateAsync(
        CreateScreeningRequestDto request,
        CancellationToken token
    );
    Task<ScreeningResponseDto?> UpdateAsync(
        Guid id,
        UpdateScreeningRequestDto request,
        CancellationToken token
    );
    Task<bool> DeleteAsync(Guid id, CancellationToken token);
    Task<bool> HasOverlapAsync(
        Guid hallId,
        DateTime start,
        DateTime end,
        Guid? excludedId,
        CancellationToken token
    );
}
