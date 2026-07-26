using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AuthMicroservice.Database;

public sealed class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
{
    public AuthDbContext CreateDbContext(string[] args)
    {
        DotEnvReader.Load();
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__AuthDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings__AuthDatabase must be configured in .env.");

        var options = new DbContextOptionsBuilder<AuthDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new AuthDbContext(options);
    }
}
