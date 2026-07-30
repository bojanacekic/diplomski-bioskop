using TicketPurchases.Domain;

namespace TicketPurchases.Services;

public interface ITicketPurchaseService
{
    Task<IReadOnlyList<TicketPurchaseResponseDto>> GetForUserAsync(
        Guid userId,
        CancellationToken token
    );

    Task<TicketPurchaseResponseDto> PurchaseAsync(
        Guid userId,
        string authorizationHeader,
        PurchaseTicketRequestDto request,
        CancellationToken token
    );

    Task<TicketPdfDataDto?> GetPdfDataAsync(
        Guid ticketId,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    );
}
