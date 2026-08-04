namespace AuthMicroservice.Domain;

public sealed class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAtUtc { get; set; }
    public UserRole Role { get; set; } = UserRole.RegisteredUser;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
}
