using AuthMicroservice.Domain;

namespace AuthMicroservice.Services;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(RegisterUserRequestDto request, CancellationToken cancellationToken);
    Task<AuthResult> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken);
}
