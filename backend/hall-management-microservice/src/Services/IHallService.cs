using Halls.Domain;
namespace Halls.Services;
public interface IHallService { Task<IReadOnlyList<HallResponseDto>> GetAsync(string? search, CancellationToken token); Task<HallResponseDto> CreateAsync(CreateHallRequestDto request, CancellationToken token); }
