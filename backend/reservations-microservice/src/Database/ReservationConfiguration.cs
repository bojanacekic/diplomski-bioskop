using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Reservations.Domain;

namespace Reservations.Database;

public sealed class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
{
    public void Configure(EntityTypeBuilder<Reservation> builder)
    {
        builder.ToTable("Reservations");
        builder.HasKey(reservation => reservation.Id);
        builder.Property(reservation => reservation.SeatLabel).HasMaxLength(10).IsRequired();
        builder.Property(reservation => reservation.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(reservation => new { reservation.UserId, reservation.ReservedAtUtc });
        builder
            .HasIndex(reservation => new { reservation.ScreeningId, reservation.SeatLabel })
            .HasFilter("[Status] IN ('Active', 'Confirmed')")
            .IsUnique();
    }
}
