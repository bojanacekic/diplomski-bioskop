namespace AuthMicroservice.Domain;

public sealed class UpdateProfileRequestDto
{
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}
