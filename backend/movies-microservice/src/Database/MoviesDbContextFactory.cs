using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Movies.Database;

public sealed class MoviesDbContextFactory : IDesignTimeDbContextFactory<MoviesDbContext>
{
    public MoviesDbContext CreateDbContext(string[] args)
    {
        DotEnvReader.Load();
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__MoviesDatabase")
            ?? throw new InvalidOperationException(
                "ConnectionStrings__MoviesDatabase must be configured in .env."
            );

        return new MoviesDbContext(
            new DbContextOptionsBuilder<MoviesDbContext>().UseSqlServer(connectionString).Options
        );
    }
}
