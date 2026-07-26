using AuthMicroservice.Domain;
namespace AuthMicroservice.Services;
public interface IUserManagementService { Task<UserResponseDto?> GetAsync(Guid id, CancellationToken token); Task<IReadOnlyList<UserResponseDto>> SearchAsync(string? search, CancellationToken token); Task<UserResponseDto?> UpdateProfileAsync(Guid id, UpdateProfileRequestDto request, CancellationToken token); Task<UserResponseDto?> ChangeRoleAsync(Guid id, UserRole role, CancellationToken token); Task<bool> DeactivateAsync(Guid id, CancellationToken token); }
