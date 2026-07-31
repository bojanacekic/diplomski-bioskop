namespace Payments.Domain;

public sealed class AuthorizePaymentRequestDto
{
    public Guid ReservationId { get; init; }
    public decimal Amount { get; init; }
    public string CardholderName { get; init; } = string.Empty;
    public string CardNumber { get; init; } = string.Empty;
    public string ExpiryDate { get; init; } = string.Empty;
    public string Cvv { get; init; } = string.Empty;
}
