using Microsoft.EntityFrameworkCore;
using Payments.Database;
using Payments.Domain;

namespace Payments.Services;

public sealed class PaymentService(PaymentsDbContext db) : IPaymentService
{
    public async Task<IReadOnlyList<PaymentResponseDto>> GetForUserAsync(
        Guid userId,
        CancellationToken token
    )
    {
        var payments = await db.Payments
            .AsNoTracking()
            .Where(payment => payment.UserId == userId)
            .OrderByDescending(payment => payment.CreatedAtUtc)
            .ToListAsync(token);

        return payments.Select(Map).ToList();
    }

    public async Task<PaymentResponseDto> AuthorizeAsync(
        Guid userId,
        AuthorizePaymentRequestDto request,
        CancellationToken token
    )
    {
        var cardNumber = request.CardNumber.Replace(" ", string.Empty).Replace("-", string.Empty);
        var lastFour = cardNumber[^4..];
        var isDeclined = lastFour == "0000";
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ReservationId = request.ReservationId,
            Amount = request.Amount,
            CardLastFour = lastFour,
            Status = isDeclined ? PaymentStatus.Declined : PaymentStatus.Authorized,
            FailureReason = isDeclined ? "The test card was declined." : null,
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.Payments.Add(payment);
        await db.SaveChangesAsync(token);
        return Map(payment);
    }

    public async Task<PaymentResponseDto?> CaptureAsync(
        Guid id,
        Guid userId,
        CancellationToken token
    )
    {
        var payment = await db.Payments.SingleOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            token
        );
        if (payment is null)
            return null;

        if (payment.Status == PaymentStatus.Authorized)
        {
            payment.Status = PaymentStatus.Captured;
            payment.CapturedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(token);
        }

        return Map(payment);
    }

    public async Task<PaymentResponseDto?> VoidAsync(Guid id, Guid userId, CancellationToken token)
    {
        var payment = await db.Payments.SingleOrDefaultAsync(
            item => item.Id == id && item.UserId == userId,
            token
        );
        if (payment is null)
            return null;

        if (payment.Status == PaymentStatus.Authorized)
        {
            payment.Status = PaymentStatus.Voided;
            payment.VoidedAtUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(token);
        }

        return Map(payment);
    }

    private static PaymentResponseDto Map(Payment payment) =>
        new()
        {
            Id = payment.Id,
            ReservationId = payment.ReservationId,
            Amount = payment.Amount,
            CardLastFour = payment.CardLastFour,
            Status = payment.Status,
            FailureReason = payment.FailureReason,
            CreatedAtUtc = DateTime.SpecifyKind(payment.CreatedAtUtc, DateTimeKind.Utc),
            CapturedAtUtc = payment.CapturedAtUtc.HasValue
                ? DateTime.SpecifyKind(payment.CapturedAtUtc.Value, DateTimeKind.Utc)
                : null,
            VoidedAtUtc = payment.VoidedAtUtc.HasValue
                ? DateTime.SpecifyKind(payment.VoidedAtUtc.Value, DateTimeKind.Utc)
                : null,
        };
}
