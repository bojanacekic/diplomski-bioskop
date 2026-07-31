namespace TicketPurchases.Domain;

public sealed class PaymentTransactionResponseDto
{
    public Guid Id { get; init; }
    public int Status { get; init; }
    public string? FailureReason { get; init; }
}
