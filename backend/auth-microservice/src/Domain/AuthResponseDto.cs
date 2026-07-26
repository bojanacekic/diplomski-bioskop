namespace AuthMicroservice.Domain;

public sealed class AuthResponseDto
{
    public string AccessToken { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
    public Guid UserId { get; init; }
    public string Username { get; init; } = string.Empty;
    public UserRole Role { get; init; }
}
