using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Payments.Domain;

namespace Payments.Database;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(payment => payment.Id);
        builder.Property(payment => payment.Amount).HasPrecision(10, 2);
        builder.Property(payment => payment.CardLastFour).HasMaxLength(4).IsRequired();
        builder.Property(payment => payment.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(payment => payment.FailureReason).HasMaxLength(255);
        builder.HasIndex(payment => new { payment.UserId, payment.CreatedAtUtc });
        builder.HasIndex(payment => payment.ReservationId);
    }
}
