namespace TicketPurchases.Domain;

public sealed class TicketValidationResponseDto
{
    public bool IsValid { get; init; }
    public string Message { get; init; } = string.Empty;
    public string TicketNumber { get; init; } = string.Empty;
}
