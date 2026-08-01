using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RatingsRecommendations.Domain;
namespace RatingsRecommendations.Database;
public sealed class MovieRatingConfiguration : IEntityTypeConfiguration<MovieRating>
{
 public void Configure(EntityTypeBuilder<MovieRating> builder) { builder.ToTable("MovieRatings"); builder.HasKey(x => x.Id); builder.HasIndex(x => new { x.UserId, x.MovieId }).IsUnique(); builder.HasIndex(x => x.MovieId); }
}
