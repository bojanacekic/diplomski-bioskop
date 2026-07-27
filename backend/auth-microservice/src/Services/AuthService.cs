using AuthMicroservice.Database;
using AuthMicroservice.Domain;
using Microsoft.EntityFrameworkCore;

namespace AuthMicroservice.Services;

public sealed class AuthService(AuthDbContext dbContext, IJwtTokenGenerator jwtTokenGenerator)
    : IAuthService
{
    public async Task<AuthResult> RegisterAsync(
        RegisterUserRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();
        var alreadyExists = await dbContext.Users.AnyAsync(
            user => user.Username == username || user.Email == email,
            cancellationToken
        );

        if (alreadyExists)
        {
            return AuthResult.Failure("A user with this username or email already exists.");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            CreatedAtUtc = DateTime.UtcNow,
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return AuthResult.Success(jwtTokenGenerator.Generate(user));
    }

    public async Task<AuthResult> LoginAsync(
        LoginRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var identifier = request.UsernameOrEmail.Trim();
        var normalizedEmail = identifier.ToLowerInvariant();
        var user = await dbContext.Users.SingleOrDefaultAsync(
            candidate => candidate.Username == identifier || candidate.Email == normalizedEmail,
            cancellationToken
        );

        if (
            user is null
            || !user.IsActive
            || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)
        )
        {
            return AuthResult.Failure("Invalid username/email or password.");
        }

        return AuthResult.Success(jwtTokenGenerator.Generate(user));
    }
}
