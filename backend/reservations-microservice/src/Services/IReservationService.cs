using Reservations.Domain;

namespace Reservations.Services;

public interface IReservationService
{
    Task<IReadOnlyList<ReservationResponseDto>> GetForUserAsync(Guid userId, CancellationToken token);
    Task<IReadOnlyList<ReservationResponseDto>> GetAllAsync(Guid? screeningId, CancellationToken token);
    Task<IReadOnlyList<ReservedSeatResponseDto>> GetReservedSeatsAsync(Guid screeningId, Guid? userId, CancellationToken token);
    Task<IReadOnlyList<ReservationResponseDto>> CreateAsync(Guid userId, CreateReservationRequestDto request, CancellationToken token);
    Task<bool> CancelAsync(
        Guid id,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    );
}
