using Microsoft.EntityFrameworkCore;
using Reservations.Database;
using Reservations.Domain;
using System.Net.Http.Json;

namespace Reservations.Services;

public sealed class ReservationService(ReservationsDbContext db, IHttpClientFactory httpClientFactory)
    : IReservationService
{
    public async Task<IReadOnlyList<ReservationResponseDto>> GetForUserAsync(
        Guid userId,
        CancellationToken token
    )
    {
        var reservations = await db.Reservations
            .AsNoTracking()
            .Where(reservation => reservation.UserId == userId)
            .OrderByDescending(reservation => reservation.ReservedAtUtc)
            .ToListAsync(token);

        return reservations.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<ReservationResponseDto>> GetAllAsync(
        Guid? screeningId,
        CancellationToken token
    )
    {
        var query = db.Reservations.AsNoTracking();
        if (screeningId.HasValue)
            query = query.Where(reservation => reservation.ScreeningId == screeningId.Value);

        var reservations = await query
            .OrderByDescending(reservation => reservation.ReservedAtUtc)
            .ToListAsync(token);

        return reservations.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<string>> GetReservedSeatsAsync(
        Guid screeningId,
        CancellationToken token
    ) =>
        await db.Reservations
            .AsNoTracking()
            .Where(
                reservation =>
                    reservation.ScreeningId == screeningId
                    && reservation.Status == ReservationStatus.Active
            )
            .OrderBy(reservation => reservation.SeatLabel)
            .Select(reservation => reservation.SeatLabel)
            .ToListAsync(token);

    public async Task<ReservationResponseDto> CreateAsync(
        Guid userId,
        CreateReservationRequestDto request,
        CancellationToken token
    )
    {
        var seatLabel = request.SeatLabel.Trim().ToUpperInvariant();
        await ValidateScreeningAndSeatAsync(request.ScreeningId, seatLabel, token);
        var seatIsReserved = await db.Reservations.AnyAsync(
            reservation =>
                reservation.ScreeningId == request.ScreeningId
                && reservation.SeatLabel == seatLabel
                && reservation.Status == ReservationStatus.Active,
            token
        );
        if (seatIsReserved)
            throw new InvalidOperationException("This seat is already reserved for the screening.");

        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ScreeningId = request.ScreeningId,
            SeatLabel = seatLabel,
            ReservedAtUtc = DateTime.UtcNow,
        };

        db.Reservations.Add(reservation);
        await db.SaveChangesAsync(token);
        return Map(reservation);
    }

    public async Task<bool> CancelAsync(Guid id, Guid userId, CancellationToken token)
    {
        var reservation = await db.Reservations.SingleOrDefaultAsync(
            item => item.Id == id && item.UserId == userId && item.Status == ReservationStatus.Active,
            token
        );
        if (reservation is null)
            return false;

        reservation.Status = ReservationStatus.Cancelled;
        reservation.CancelledAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(token);
        return true;
    }

    private async Task ValidateScreeningAndSeatAsync(
        Guid screeningId,
        string seatLabel,
        CancellationToken token
    )
    {
        try
        {
            var gateway = httpClientFactory.CreateClient("Gateway");
            var screening = await GetFromGatewayAsync<ScreeningDetailsDto>(
                gateway,
                $"api/screenings/{screeningId}",
                token
            );
            if (screening is null)
                throw new InvalidOperationException("The selected screening does not exist.");
            if (screening.Status is 2 or 3)
                throw new InvalidOperationException("Reservations are not available for this screening.");

            var hall = await GetFromGatewayAsync<HallDetailsDto>(
                gateway,
                $"api/halls/{screening.HallId}",
                token
            );
            if (hall is null || !hall.IsActive)
                throw new InvalidOperationException("The screening hall is unavailable.");

            var seatParts = seatLabel.Split('-', StringSplitOptions.TrimEntries);
            var validSeat =
                seatParts.Length == 2
                && int.TryParse(seatParts[0], out var row)
                && int.TryParse(seatParts[1], out var seat)
                && row is > 0 and <= hall.Rows
                && seat is > 0 and <= hall.SeatsPerRow;
            if (!validSeat)
                throw new InvalidOperationException("The selected seat does not exist in this hall.");
        }
        catch (HttpRequestException)
        {
            throw new InvalidOperationException("Screening information is temporarily unavailable.");
        }
    }

    private static async Task<T?> GetFromGatewayAsync<T>(
        HttpClient gateway,
        string path,
        CancellationToken token
    )
    {
        using var response = await gateway.GetAsync(path, token);
        return response.IsSuccessStatusCode
            ? await response.Content.ReadFromJsonAsync<T>(cancellationToken: token)
            : default;
    }

    private static ReservationResponseDto Map(Reservation reservation) =>
        new()
        {
            Id = reservation.Id,
            UserId = reservation.UserId,
            ScreeningId = reservation.ScreeningId,
            SeatLabel = reservation.SeatLabel,
            Status = reservation.Status,
            ReservedAtUtc = DateTime.SpecifyKind(reservation.ReservedAtUtc, DateTimeKind.Utc),
            CancelledAtUtc = reservation.CancelledAtUtc.HasValue
                ? DateTime.SpecifyKind(reservation.CancelledAtUtc.Value, DateTimeKind.Utc)
                : null,
        };
}
