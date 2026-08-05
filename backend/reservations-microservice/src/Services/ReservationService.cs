using Microsoft.EntityFrameworkCore;
using Reservations.Database;
using Reservations.Domain;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Net;
using Microsoft.Extensions.Logging;

namespace Reservations.Services;

public sealed class ReservationService(
    ReservationsDbContext db,
    IHttpClientFactory httpClientFactory,
    IEmailSender emailSender,
    ILogger<ReservationService> logger
)
    : IReservationService
{
    public async Task<IReadOnlyList<ReservationResponseDto>> GetForUserAsync(
        Guid userId,
        CancellationToken token
    )
    {
        await ExpireDueReservationsAsync(token);
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
        await ExpireDueReservationsAsync(token);
        var query = db.Reservations.AsNoTracking();
        if (screeningId.HasValue)
            query = query.Where(reservation => reservation.ScreeningId == screeningId.Value);

        var reservations = await query
            .OrderByDescending(reservation => reservation.ReservedAtUtc)
            .ToListAsync(token);

        return reservations.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<ReservedSeatResponseDto>> GetReservedSeatsAsync(
        Guid screeningId,
        Guid? userId,
        CancellationToken token
    )
    {
        await ExpireDueReservationsAsync(token);
        return await db.Reservations
            .AsNoTracking()
            .Where(
                reservation =>
                    reservation.ScreeningId == screeningId
                    && (
                        reservation.Status == ReservationStatus.Active
                        || reservation.Status == ReservationStatus.Confirmed
                    )
            )
            .OrderBy(reservation => reservation.SeatLabel)
            .Select(reservation => new ReservedSeatResponseDto
            {
                SeatLabel = reservation.SeatLabel,
                IsMine = userId.HasValue && reservation.UserId == userId.Value,
            })
            .ToListAsync(token);
    }

    public async Task<IReadOnlyList<ReservationResponseDto>> CreateAsync(
        Guid userId,
        string authorizationHeader,
        CreateReservationRequestDto request,
        CancellationToken token
    )
    {
        await ExpireDueReservationsAsync(token);
        var seatLabels = request
            .SeatLabels.Select(seat => seat.Trim().ToUpperInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
        await ValidateScreeningAndSeatsAsync(request.ScreeningId, seatLabels, token);
        var reservedSeatExists = await db.Reservations.AnyAsync(
            reservation =>
                reservation.ScreeningId == request.ScreeningId
                && seatLabels.Contains(reservation.SeatLabel)
                && (
                    reservation.Status == ReservationStatus.Active
                    || reservation.Status == ReservationStatus.Confirmed
                ),
            token
        );
        if (reservedSeatExists)
            throw new InvalidOperationException("One or more selected seats are already reserved.");

        var now = DateTime.UtcNow;
        var reservationGroupId = Guid.NewGuid();
        var reservations = seatLabels
            .Select(seatLabel => new Reservation
            {
                Id = Guid.NewGuid(),
                ReservationGroupId = reservationGroupId,
                UserId = userId,
                ScreeningId = request.ScreeningId,
                SeatLabel = seatLabel,
                ReservedAtUtc = now,
            })
            .ToArray();

        db.Reservations.AddRange(reservations);
        try
        {
            await db.SaveChangesAsync(token);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException("One or more selected seats are already reserved.");
        }

        try
        {
            var userEmail = await GetCurrentUserEmailAsync(authorizationHeader, token);
            var gateway = httpClientFactory.CreateClient("Gateway");
            var screening = await GetFromGatewayAsync<ScreeningDetailsDto>(
                gateway,
                $"api/screenings/{request.ScreeningId}",
                token
            );
            var movie = screening is null
                ? null
                : await GetFromGatewayAsync<MovieDetailsDto>(
                    gateway,
                    $"api/movies/{screening.MovieId}",
                    token
                );
            var seats = WebUtility.HtmlEncode(string.Join(", ", seatLabels));
            var movieTitle = WebUtility.HtmlEncode(movie?.Title ?? "Movie information unavailable");
            var screeningTime = screening is null
                ? "Screening information unavailable"
                : DateTime.SpecifyKind(screening.StartsAtUtc, DateTimeKind.Utc)
                    .ToLocalTime()
                    .ToString("dd.MM.yyyy. HH:mm");
            var bookingReference = $"SC-{reservationGroupId:N}"[..11].ToUpperInvariant();
            await emailSender.SendAsync(
                userEmail,
                "Smart Cinema reservation confirmed",
                $"""
                <p>Your Smart Cinema reservation was created successfully.</p>
                <p><strong>Movie:</strong> {movieTitle}</p>
                <p><strong>Screening:</strong> {screeningTime}</p>
                <p><strong>Seats:</strong> {seats}</p>
                <p><strong>Booking reference:</strong> {bookingReference}</p>
                <p>You can review and manage the reservation under <strong>My reservations</strong>.</p>
                """,
                token
            );
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(
                exception,
                "Reservation {ReservationGroupId} was created, but its confirmation email could not be sent.",
                reservationGroupId
            );
        }
        return reservations.Select(Map).ToList();
    }

    private async Task<string> GetCurrentUserEmailAsync(
        string authorizationHeader,
        CancellationToken token
    )
    {
        var gateway = httpClientFactory.CreateClient("Gateway");
        using var request = new HttpRequestMessage(HttpMethod.Get, "api/users/me");
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);
        using var response = await gateway.SendAsync(request, token);
        response.EnsureSuccessStatusCode();
        var profile = await response.Content.ReadFromJsonAsync<CurrentUserProfileDto>(
            cancellationToken: token
        );
        if (string.IsNullOrWhiteSpace(profile?.Email))
            throw new InvalidOperationException("The current user's email address is unavailable.");

        return profile.Email;
    }

    public async Task<bool> CancelAsync(
        Guid id,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    )
    {
        var reservation = await db.Reservations.SingleOrDefaultAsync(
            item =>
                item.Id == id
                && item.UserId == userId
                && (
                    item.Status == ReservationStatus.Active
                    || item.Status == ReservationStatus.Confirmed
                ),
            token
        );
        if (reservation is null)
            return false;

        var groupReservations = reservation.ReservationGroupId.HasValue
            ? await db.Reservations
                .Where(item =>
                    item.UserId == userId
                    && item.ReservationGroupId == reservation.ReservationGroupId
                    && (item.Status == ReservationStatus.Active || item.Status == ReservationStatus.Confirmed))
                .ToListAsync(token)
            : new List<Reservation> { reservation };
        foreach (var item in groupReservations)
            await EnsureReservationHasNoPurchasedTicketAsync(item.Id, authorizationHeader, token);

        var cancelledAtUtc = DateTime.UtcNow;
        foreach (var item in groupReservations)
        {
            item.Status = ReservationStatus.Cancelled;
            item.CancelledAtUtc = cancelledAtUtc;
        }
        await db.SaveChangesAsync(token);
        return true;
    }

    public async Task<int> DeleteForScreeningAsync(
        Guid screeningId,
        string authorizationHeader,
        CancellationToken token
    )
    {
        var reservations = await db.Reservations
            .Where(item => item.ScreeningId == screeningId &&
                (item.Status == ReservationStatus.Active || item.Status == ReservationStatus.Confirmed))
            .ToListAsync(token);
        if (reservations.Count == 0)
            return 0;

        var gateway = httpClientFactory.CreateClient("Gateway");
        var screening = await GetFromGatewayAsync<ScreeningDetailsDto>(gateway, $"api/screenings/{screeningId}", token);
        var movie = screening is null ? null : await GetFromGatewayAsync<MovieDetailsDto>(gateway, $"api/movies/{screening.MovieId}", token);
        db.Reservations.RemoveRange(reservations);
        await db.SaveChangesAsync(token);

        foreach (var userId in reservations.Select(item => item.UserId).Distinct())
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, $"api/users/{userId}/reservation-customer");
                request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);
                using var response = await gateway.SendAsync(request, token);
                if (!response.IsSuccessStatusCode) continue;
                var customer = await response.Content.ReadFromJsonAsync<ReservationCustomerDto>(cancellationToken: token);
                if (string.IsNullOrWhiteSpace(customer?.Email)) continue;
                var title = WebUtility.HtmlEncode(movie?.Title ?? "your selected movie");
                await emailSender.SendAsync(customer.Email, "Smart Cinema screening cancelled", $"""
                    <p>Hello {WebUtility.HtmlEncode(customer.FirstName)},</p>
                    <p>The screening for <strong>{title}</strong> has been cancelled.</p>
                    <p>Your reservation and any related tickets have been removed. Any online payment has been refunded.</p>
                    """, token);
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogError(exception, "Cancellation email could not be sent to user {UserId}.", userId);
            }
        }
        return reservations.Count;
    }

    public async Task<IReadOnlyList<ReservationResponseDto>> RequestCashPaymentAsync(
        Guid id,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    )
    {
        var reservation = await db.Reservations.SingleOrDefaultAsync(
            item => item.Id == id && item.UserId == userId && item.Status == ReservationStatus.Active,
            token
        );
        if (reservation is null)
            return [];

        await EnsureReservationHasNoPurchasedTicketAsync(id, authorizationHeader, token);
        var groupReservations = await GetReservationGroupAsync(reservation, token);
        foreach (var item in groupReservations)
            item.PaymentOption = ReservationPaymentOption.CashAtBoxOffice;
        await db.SaveChangesAsync(token);
        return groupReservations.Select(Map).ToList();
    }

    public async Task<bool> ConfirmAsync(
        Guid id,
        Guid userId,
        bool canManageReservations,
        CancellationToken token
    )
    {
        await ExpireDueReservationsAsync(token);
        var reservation = await db.Reservations.SingleOrDefaultAsync(
            item =>
                item.Id == id
                && item.Status == ReservationStatus.Active
                && (canManageReservations || item.UserId == userId),
            token
        );
        if (reservation is null)
            return false;

        reservation.Status = ReservationStatus.Confirmed;
        await db.SaveChangesAsync(token);
        return true;
    }

    public async Task ExpireDueReservationsAsync(CancellationToken token)
    {
        var activeReservations = await db.Reservations
            .Where(reservation => reservation.Status == ReservationStatus.Active)
            .ToListAsync(token);
        if (activeReservations.Count == 0)
            return;

        var gateway = httpClientFactory.CreateClient("Gateway");
        var now = DateTime.UtcNow;
        var screenings = new Dictionary<Guid, ScreeningDetailsDto?>();
        foreach (var screeningId in activeReservations.Select(item => item.ScreeningId).Distinct())
        {
            screenings[screeningId] = await GetFromGatewayAsync<ScreeningDetailsDto>(
                gateway,
                $"api/screenings/{screeningId}",
                token
            );
        }

        var reservationsToExpire = activeReservations.Where(reservation =>
        {
            var screening = screenings[reservation.ScreeningId];
            return screening is not null
                && DateTime.SpecifyKind(screening.StartsAtUtc, DateTimeKind.Utc).AddMinutes(-30) <= now;
        });

        foreach (var reservation in reservationsToExpire)
        {
            reservation.Status = ReservationStatus.Expired;
            reservation.ExpiredAtUtc = now;
        }

        if (db.ChangeTracker.HasChanges())
            await db.SaveChangesAsync(token);
    }

    private async Task EnsureReservationHasNoPurchasedTicketAsync(
        Guid reservationId,
        string authorizationHeader,
        CancellationToken token
    )
    {
        try
        {
            var gateway = httpClientFactory.CreateClient("Gateway");
            using var request = new HttpRequestMessage(
                HttpMethod.Get,
                $"api/tickets/reservations/{reservationId}/exists"
            );
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);

            using var response = await gateway.SendAsync(request, token);
            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException(
                    "Ticket information is temporarily unavailable. The reservation cannot be cancelled."
                );

            var hasPurchasedTicket =
                await response.Content.ReadFromJsonAsync<bool>(cancellationToken: token);
            if (hasPurchasedTicket)
                throw new InvalidOperationException(
                    "Reservations with purchased tickets cannot be cancelled."
                );
        }
        catch (HttpRequestException)
        {
            throw new InvalidOperationException(
                "Ticket information is temporarily unavailable. The reservation cannot be cancelled."
            );
        }
    }

    private async Task ValidateScreeningAndSeatsAsync(
        Guid screeningId,
        IReadOnlyList<string> seatLabels,
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
            if (
                DateTime.SpecifyKind(screening.StartsAtUtc, DateTimeKind.Utc)
                <= DateTime.UtcNow.AddMinutes(30)
            )
                throw new InvalidOperationException(
                    "Reservations are no longer available within 30 minutes of the screening start time."
                );

            var hall = await GetFromGatewayAsync<HallDetailsDto>(
                gateway,
                $"api/halls/{screening.HallId}",
                token
            );
            if (hall is null || !hall.IsActive)
                throw new InvalidOperationException("The screening hall is unavailable.");

            var allSeatsAreValid = seatLabels.All(seatLabel =>
            {
                var seatParts = seatLabel.Split('-', StringSplitOptions.TrimEntries);
                return
                    seatParts.Length == 2
                    && int.TryParse(seatParts[0], out var row)
                    && int.TryParse(seatParts[1], out var seat)
                    && row > 0
                    && row <= hall.Rows
                    && seat > 0
                    && seat <= hall.SeatsPerRow;
            });
            if (!allSeatsAreValid)
                throw new InvalidOperationException("One or more selected seats do not exist in this hall.");
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
            ReservationGroupId = reservation.ReservationGroupId,
            UserId = reservation.UserId,
            ScreeningId = reservation.ScreeningId,
            SeatLabel = reservation.SeatLabel,
            Status = reservation.Status,
            PaymentOption = reservation.PaymentOption,
            ReservedAtUtc = DateTime.SpecifyKind(reservation.ReservedAtUtc, DateTimeKind.Utc),
            CancelledAtUtc = reservation.CancelledAtUtc.HasValue
                ? DateTime.SpecifyKind(reservation.CancelledAtUtc.Value, DateTimeKind.Utc)
                : null,
            ExpiredAtUtc = reservation.ExpiredAtUtc.HasValue
                ? DateTime.SpecifyKind(reservation.ExpiredAtUtc.Value, DateTimeKind.Utc)
                : null,
        };

    private Task<List<Reservation>> GetReservationGroupAsync(
        Reservation reservation,
        CancellationToken token
    ) => reservation.ReservationGroupId.HasValue
        ? db.Reservations.Where(item =>
                item.UserId == reservation.UserId
                && item.ReservationGroupId == reservation.ReservationGroupId
                && item.Status == ReservationStatus.Active)
            .ToListAsync(token)
        : Task.FromResult(new List<Reservation> { reservation });
}
