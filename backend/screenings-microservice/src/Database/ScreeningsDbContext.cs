using Microsoft.EntityFrameworkCore;
using Screenings.Domain;

namespace Screenings.Database;

public sealed class ScreeningsDbContext(DbContextOptions<ScreeningsDbContext> options)
    : DbContext(options)
{
    public DbSet<Screening> Screenings => Set<Screening>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        var s = b.Entity<Screening>();
        s.ToTable("Screenings");
        s.HasKey(x => x.Id);
        s.Property(x => x.BaseTicketPrice).HasPrecision(10, 2);
        s.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        s.HasIndex(x => new
        {
            x.HallId,
            x.StartsAtUtc,
            x.EndsAtUtc,
        });
    }
}
