namespace AuthMicroservice.Domain;

public sealed class ForgotPasswordRequestDto
{
    public string UsernameOrEmail { get; init; } = string.Empty;
}
