using Microsoft.EntityFrameworkCore;
using Movies.Domain;

namespace Movies.Database;

public sealed class MoviesDbContext(DbContextOptions<MoviesDbContext> options) : DbContext(options)
{
    public DbSet<Movie> Movies => Set<Movie>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var movie = modelBuilder.Entity<Movie>();

        movie.ToTable("Movies");
        movie.HasKey(x => x.Id);
        movie.Property(x => x.Title).HasMaxLength(200).IsRequired();
        movie.Property(x => x.Description).HasMaxLength(2000).IsRequired();
        movie.Property(x => x.Genre).HasMaxLength(100).IsRequired();
        movie.Property(x => x.AgeRating).HasMaxLength(30).IsRequired();
        movie.Property(x => x.AverageRating).HasPrecision(3, 2);
        movie.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        movie.HasIndex(x => x.Title);
    }
}
