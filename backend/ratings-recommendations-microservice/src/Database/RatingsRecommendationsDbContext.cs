using Microsoft.EntityFrameworkCore;
using RatingsRecommendations.Domain;

namespace RatingsRecommendations.Database;

public sealed class RatingsRecommendationsDbContext(DbContextOptions<RatingsRecommendationsDbContext> options) : DbContext(options)
{
    public DbSet<MovieRating> MovieRatings => Set<MovieRating>();
    protected override void OnModelCreating(ModelBuilder modelBuilder) => modelBuilder.ApplyConfigurationsFromAssembly(typeof(RatingsRecommendationsDbContext).Assembly);
}
