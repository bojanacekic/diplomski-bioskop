using TicketPurchases.Domain;

namespace TicketPurchases.Services;

public interface ITicketPurchaseService
{
    Task<IReadOnlyList<TicketPurchaseResponseDto>> GetForUserAsync(
        Guid userId,
        CancellationToken token
    );

    Task<IReadOnlyList<TicketPurchaseResponseDto>> GetAllAsync(CancellationToken token);

    Task<TicketPurchaseResponseDto> PurchaseAsync(
        Guid userId,
        string authorizationHeader,
        PurchaseTicketRequestDto request,
        CancellationToken token
    );

    Task<TicketPurchaseResponseDto> PurchaseAtBoxOfficeAsync(
        string authorizationHeader,
        CashTicketPurchaseRequestDto request,
        CancellationToken token
    );

    Task<TicketPdfDataDto?> GetPdfDataAsync(
        Guid ticketId,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    );

    Task<bool> HasTicketForReservationAsync(
        Guid reservationId,
        Guid userId,
        CancellationToken token
    );
}
