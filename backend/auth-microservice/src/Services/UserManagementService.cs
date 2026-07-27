using AuthMicroservice.Database;
using AuthMicroservice.Domain;
using Microsoft.EntityFrameworkCore;

namespace AuthMicroservice.Services;

public sealed class UserManagementService(AuthDbContext db) : IUserManagementService
{
    public async Task<UserResponseDto?> GetAsync(Guid id, CancellationToken t) =>
        await db.Users.AsNoTracking().Where(x => x.Id == id).Select(Map()).SingleOrDefaultAsync(t);

    public async Task<IReadOnlyList<UserResponseDto>> SearchAsync(
        string? search,
        CancellationToken t
    )
    {
        var q = db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(x => x.Username.Contains(s) || x.Email.Contains(s));
        }
        return await q.OrderBy(x => x.Username).Select(Map()).ToListAsync(t);
    }

    public async Task<UserResponseDto?> UpdateProfileAsync(
        Guid id,
        UpdateProfileRequestDto r,
        CancellationToken t
    )
    {
        if (string.IsNullOrWhiteSpace(r.Username) || string.IsNullOrWhiteSpace(r.Email))
            throw new ArgumentException("Username and email are required.");
        var u = await db.Users.SingleOrDefaultAsync(x => x.Id == id, t);
        if (u is null)
            return null;
        var username = r.Username.Trim();
        var email = r.Email.Trim().ToLowerInvariant();
        if (
            await db.Users.AnyAsync(
                x => x.Id != id && (x.Username == username || x.Email == email),
                t
            )
        )
            throw new InvalidOperationException("Username or email is already in use.");
        u.Username = username;
        u.Email = email;
        await db.SaveChangesAsync(t);
        return ToDto(u);
    }

    public async Task<UserResponseDto?> ChangeRoleAsync(Guid id, UserRole role, CancellationToken t)
    {
        var u = await db.Users.SingleOrDefaultAsync(x => x.Id == id, t);
        if (u is null)
            return null;
        u.Role = role;
        await db.SaveChangesAsync(t);
        return ToDto(u);
    }

    public async Task<bool> DeactivateAsync(Guid id, CancellationToken t)
    {
        var u = await db.Users.SingleOrDefaultAsync(x => x.Id == id, t);
        if (u is null)
            return false;
        u.IsActive = false;
        await db.SaveChangesAsync(t);
        return true;
    }

    private static System.Linq.Expressions.Expression<Func<User, UserResponseDto>> Map() =>
        u => new UserResponseDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            Role = u.Role,
            IsActive = u.IsActive,
            CreatedAtUtc = u.CreatedAtUtc,
        };

    private static UserResponseDto ToDto(User u) =>
        new()
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            Role = u.Role,
            IsActive = u.IsActive,
            CreatedAtUtc = u.CreatedAtUtc,
        };
}
