using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuthMicroservice.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AuthMicroservice.Services;

public sealed class JwtTokenGenerator(IOptions<JwtSettings> settings) : IJwtTokenGenerator
{
    private readonly JwtSettings _settings = settings.Value;

    public AuthResponseDto Generate(User user)
    {
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes);
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims:
            [
                new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new(JwtRegisteredClaimNames.UniqueName, user.Username),
                new(JwtRegisteredClaimNames.Email, user.Email),
                new(ClaimTypes.Role, user.Role.ToString()),
            ],
            notBefore: DateTime.UtcNow,
            expires: expiresAtUtc,
            signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256)
        );

        return new AuthResponseDto
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAtUtc = expiresAtUtc,
            UserId = user.Id,
            Username = user.Username,
            Role = user.Role,
        };
    }
}
