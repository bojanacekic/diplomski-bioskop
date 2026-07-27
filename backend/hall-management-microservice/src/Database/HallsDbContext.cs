using Halls.Domain;
using Microsoft.EntityFrameworkCore;

namespace Halls.Database;

public sealed class HallsDbContext(DbContextOptions<HallsDbContext> options) : DbContext(options)
{
    public DbSet<Hall> Halls => Set<Hall>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        var h = b.Entity<Hall>();
        h.ToTable("Halls");
        h.HasKey(x => x.Id);
        h.Property(x => x.Name).HasMaxLength(80).IsRequired();
        h.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
        h.HasIndex(x => x.Name).IsUnique();
    }
}
