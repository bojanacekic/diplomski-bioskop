namespace AuthMicroservice.Domain;

public sealed class LoginRequestDto
{
    public string UsernameOrEmail { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
