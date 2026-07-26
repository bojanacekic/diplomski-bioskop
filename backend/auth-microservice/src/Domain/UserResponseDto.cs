namespace AuthMicroservice.Domain;
public sealed class UserResponseDto { public Guid Id { get; init; } public string Username { get; init; } = string.Empty; public string Email { get; init; } = string.Empty; public UserRole Role { get; init; } public bool IsActive { get; init; } public DateTime CreatedAtUtc { get; init; } }
