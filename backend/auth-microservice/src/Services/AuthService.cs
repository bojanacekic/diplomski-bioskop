using AuthMicroservice.Database;
using AuthMicroservice.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace AuthMicroservice.Services;

public sealed class AuthService(
    AuthDbContext dbContext,
    IJwtTokenGenerator jwtTokenGenerator,
    IEmailSender emailSender,
    IConfiguration configuration
)
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
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
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

    public async Task RequestPasswordResetAsync(
        ForgotPasswordRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var identifier = request.UsernameOrEmail.Trim();
        var normalizedEmail = identifier.ToLowerInvariant();
        var user = await dbContext.Users.SingleOrDefaultAsync(
            candidate =>
                candidate.IsActive
                && (candidate.Username == identifier || candidate.Email == normalizedEmail),
            cancellationToken
        );
        if (user is null)
            return;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.PasswordResetTokenHash = HashToken(token);
        user.PasswordResetTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(30);
        await dbContext.SaveChangesAsync(cancellationToken);

        var frontendBaseUrl =
            configuration["Frontend:BaseUrl"]
            ?? configuration["Frontend__BaseUrl"]
            ?? "http://localhost:5173";
        var resetUrl = $"{frontendBaseUrl.TrimEnd('/')}?resetToken={Uri.EscapeDataString(token)}";
        var safeName = WebUtility.HtmlEncode(user.FirstName);
        var safeUrl = WebUtility.HtmlEncode(resetUrl);
        await emailSender.SendAsync(
            user.Email,
            "Reset your Smart Cinema password",
            $"""
            <p>Hello {safeName},</p>
            <p>We received a request to reset your Smart Cinema password.</p>
            <p><a href="{safeUrl}">Choose a new password</a></p>
            <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
            """,
            cancellationToken
        );
    }

    public async Task<bool> ResetPasswordAsync(
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var tokenHash = HashToken(request.Token.Trim());
        var now = DateTime.UtcNow;
        var user = await dbContext.Users.SingleOrDefaultAsync(
            candidate =>
                candidate.IsActive
                && candidate.PasswordResetTokenHash == tokenHash
                && candidate.PasswordResetTokenExpiresAtUtc > now,
            cancellationToken
        );
        if (user is null)
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAtUtc = null;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
