namespace AuthMicroservice.Domain;

public sealed class AuthResult
{
    public bool IsSuccess { get; init; }
    public string? Error { get; init; }
    public AuthResponseDto? Response { get; init; }

    public static AuthResult Success(AuthResponseDto response) => new() { IsSuccess = true, Response = response };
    public static AuthResult Failure(string error) => new() { IsSuccess = false, Error = error };
}
