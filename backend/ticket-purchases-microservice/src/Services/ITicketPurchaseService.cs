using TicketPurchases.Domain;

namespace TicketPurchases.Services;

public interface ITicketPurchaseService
{
    Task<IReadOnlyList<TicketPurchaseResponseDto>> GetForUserAsync(
        Guid userId,
        CancellationToken token
    );

    Task<IReadOnlyList<TicketPurchaseResponseDto>> GetAllAsync(CancellationToken token);

    Task<IReadOnlyList<TicketPurchaseResponseDto>> PurchaseAsync(
        Guid userId,
        string authorizationHeader,
        PurchaseTicketRequestDto request,
        CancellationToken token
    );

    Task<IReadOnlyList<TicketPurchaseResponseDto>> PurchaseAtBoxOfficeAsync(
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

    Task<IReadOnlyList<TicketPdfDataDto>> GetReceiptDataAsync(
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

    Task<TicketValidationResponseDto> ValidateEntryAsync(
        TicketValidationRequestDto request,
        CancellationToken token
    );

    Task<IReadOnlyList<TicketPurchaseResponseDto>?> CancelAsync(
        Guid ticketId,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    );
}
