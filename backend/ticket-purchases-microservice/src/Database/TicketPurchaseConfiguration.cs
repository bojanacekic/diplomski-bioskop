using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TicketPurchases.Domain;

namespace TicketPurchases.Database;

public sealed class TicketPurchaseConfiguration : IEntityTypeConfiguration<TicketPurchase>
{
    public void Configure(EntityTypeBuilder<TicketPurchase> builder)
    {
        builder.ToTable("TicketPurchases");
        builder.HasKey(ticket => ticket.Id);
        builder.Property(ticket => ticket.SeatLabel).HasMaxLength(10).IsRequired();
        builder.Property(ticket => ticket.TicketNumber).HasMaxLength(32).IsRequired();
        builder.Property(ticket => ticket.PricePaid).HasPrecision(10, 2);
        builder.Property(ticket => ticket.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(ticket => ticket.ReservationId).IsUnique();
        builder.HasIndex(ticket => ticket.PaymentId).IsUnique().HasFilter("[PaymentId] IS NOT NULL");
        builder.HasIndex(ticket => new { ticket.UserId, ticket.PurchasedAtUtc });
        builder.HasIndex(ticket => ticket.TicketNumber).IsUnique();
    }
}
