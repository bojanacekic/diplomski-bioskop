using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using TicketPurchases.Database;
using TicketPurchases.Domain;

namespace TicketPurchases.Services;

public sealed class TicketPurchaseService(
    TicketsDbContext db,
    IHttpClientFactory httpClientFactory
) : ITicketPurchaseService
{
    public async Task<IReadOnlyList<TicketPurchaseResponseDto>> GetForUserAsync(
        Guid userId,
        CancellationToken token
    )
    {
        var purchases = await db.TicketPurchases
            .AsNoTracking()
            .Where(ticket => ticket.UserId == userId)
            .OrderByDescending(ticket => ticket.PurchasedAtUtc)
            .ToListAsync(token);

        return purchases.Select(Map).ToList();
    }

    public async Task<TicketPurchaseResponseDto> PurchaseAsync(
        Guid userId,
        string authorizationHeader,
        PurchaseTicketRequestDto request,
        CancellationToken token
    )
    {
        if (await db.TicketPurchases.AnyAsync(ticket => ticket.ReservationId == request.ReservationId, token))
            throw new InvalidOperationException("A ticket has already been purchased for this reservation.");

        var gateway = httpClientFactory.CreateClient("Gateway");
        var reservations = await GetFromGatewayAsync<List<ReservationDetailsDto>>(
            gateway,
            "api/reservations/me",
            authorizationHeader,
            token
        );
        var reservation = reservations?.SingleOrDefault(item => item.Id == request.ReservationId);
        if (reservation is null || reservation.Status != 1)
            throw new InvalidOperationException("Only your active reservations can be purchased.");

        var screening = await GetFromGatewayAsync<ScreeningDetailsDto>(
            gateway,
            $"api/screenings/{reservation.ScreeningId}",
            null,
            token
        );
        if (screening is null || screening.Status is 2 or 3)
            throw new InvalidOperationException("The selected screening is unavailable.");
        if (DateTime.SpecifyKind(screening.StartsAtUtc, DateTimeKind.Utc) <= DateTime.UtcNow)
            throw new InvalidOperationException(
                "Tickets can no longer be purchased because this screening has already started."
            );

        var payment = await AuthorizePaymentAsync(
            gateway,
            authorizationHeader,
            new PaymentAuthorizationRequestDto
            {
                ReservationId = reservation.Id,
                Amount = screening.BaseTicketPrice,
                CardholderName = request.CardholderName,
                CardNumber = request.CardNumber,
                ExpiryDate = request.ExpiryDate,
                Cvv = request.Cvv,
            },
            token
        );
        if (payment.Status == 4)
            throw new InvalidOperationException(
                payment.FailureReason ?? "The payment was declined."
            );
        if (payment.Status != 1)
            throw new InvalidOperationException("The payment could not be authorized.");

        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ReservationId = reservation.Id,
            ScreeningId = reservation.ScreeningId,
            SeatLabel = reservation.SeatLabel,
            PaymentId = payment.Id,
            PaymentMethod = PaymentMethod.OnlineCard,
            TicketNumber = $"SC-{Guid.NewGuid():N}"[..15].ToUpperInvariant(),
            PricePaid = screening.BaseTicketPrice,
            PurchasedAtUtc = DateTime.UtcNow,
        };

        db.TicketPurchases.Add(purchase);
        try
        {
            await db.SaveChangesAsync(token);
        }
        catch (DbUpdateException)
        {
            await VoidPaymentAsync(gateway, authorizationHeader, payment.Id, token);
            throw new InvalidOperationException(
                "A ticket has already been purchased for this reservation. The payment was voided."
            );
        }

        try
        {
            var capturedPayment = await UpdatePaymentAsync(
                gateway,
                authorizationHeader,
                payment.Id,
                "capture",
                token
            );
            if (capturedPayment.Status != 2)
                throw new InvalidOperationException("The payment could not be completed.");
        }
        catch (Exception exception) when (
            exception is HttpRequestException or InvalidOperationException
        )
        {
            db.TicketPurchases.Remove(purchase);
            await db.SaveChangesAsync(token);
            await VoidPaymentAsync(gateway, authorizationHeader, payment.Id, token);
            throw new InvalidOperationException(
                "Ticket purchase could not be completed. The payment was voided."
            );
        }

        if (!await ConfirmReservationAsync(gateway, authorizationHeader, reservation.Id, token))
            throw new InvalidOperationException("The ticket was issued, but its reservation could not be confirmed.");

        return Map(purchase);
    }

    public async Task<IReadOnlyList<TicketPurchaseResponseDto>> GetAllAsync(CancellationToken token)
    {
        var purchases = await db.TicketPurchases
            .AsNoTracking()
            .OrderByDescending(ticket => ticket.PurchasedAtUtc)
            .ToListAsync(token);

        return purchases.Select(Map).ToList();
    }

    public async Task<TicketPurchaseResponseDto> PurchaseAtBoxOfficeAsync(
        string authorizationHeader,
        CashTicketPurchaseRequestDto request,
        CancellationToken token
    )
    {
        if (await db.TicketPurchases.AnyAsync(ticket => ticket.ReservationId == request.ReservationId, token))
            throw new InvalidOperationException("A ticket has already been purchased for this reservation.");

        var gateway = httpClientFactory.CreateClient("Gateway");
        var reservations = await GetFromGatewayAsync<List<ReservationDetailsDto>>(
            gateway,
            "api/reservations",
            authorizationHeader,
            token
        );
        var reservation = reservations?.SingleOrDefault(item => item.Id == request.ReservationId);
        if (reservation is null || reservation.Status != 1)
            throw new InvalidOperationException("Only active reservations can be purchased at the box office.");

        var screening = await GetFromGatewayAsync<ScreeningDetailsDto>(
            gateway,
            $"api/screenings/{reservation.ScreeningId}",
            null,
            token
        );
        if (screening is null || screening.Status is 2 or 3)
            throw new InvalidOperationException("The selected screening is unavailable.");
        if (DateTime.SpecifyKind(screening.StartsAtUtc, DateTimeKind.Utc) <= DateTime.UtcNow)
            throw new InvalidOperationException(
                "Tickets can no longer be purchased because this screening has already started."
            );

        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            UserId = reservation.UserId,
            ReservationId = reservation.Id,
            ScreeningId = reservation.ScreeningId,
            SeatLabel = reservation.SeatLabel,
            PaymentMethod = PaymentMethod.CashAtBoxOffice,
            TicketNumber = $"SC-{Guid.NewGuid():N}"[..15].ToUpperInvariant(),
            PricePaid = screening.BaseTicketPrice,
            PurchasedAtUtc = DateTime.UtcNow,
        };

        db.TicketPurchases.Add(purchase);
        try
        {
            await db.SaveChangesAsync(token);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException("A ticket has already been purchased for this reservation.");
        }

        if (!await ConfirmReservationAsync(gateway, authorizationHeader, reservation.Id, token))
            throw new InvalidOperationException("The ticket was issued, but its reservation could not be confirmed.");

        return Map(purchase);
    }

    public async Task<TicketPdfDataDto?> GetPdfDataAsync(
        Guid ticketId,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    )
    {
        var ticket = await db.TicketPurchases.AsNoTracking().SingleOrDefaultAsync(
            item => item.Id == ticketId && item.UserId == userId,
            token
        );
        if (ticket is null)
            return null;

        var gateway = httpClientFactory.CreateClient("Gateway");
        var screening = await GetFromGatewayAsync<ScreeningDetailsDto>(
            gateway,
            $"api/screenings/{ticket.ScreeningId}",
            null,
            token
        );
        if (screening is null)
            return null;

        var reservations = await GetFromGatewayAsync<List<ReservationDetailsDto>>(
            gateway,
            "api/reservations/me",
            authorizationHeader,
            token
        );
        var reservation = reservations?.SingleOrDefault(item => item.Id == ticket.ReservationId);
        var movie = await GetFromGatewayAsync<MovieDetailsDto>(
            gateway,
            $"api/movies/{screening.MovieId}",
            null,
            token
        );
        var hall = await GetFromGatewayAsync<HallDetailsDto>(
            gateway,
            $"api/halls/{screening.HallId}",
            null,
            token
        );

        return new TicketPdfDataDto
        {
            TicketNumber = ticket.TicketNumber,
            MovieTitle = movie?.Title ?? "Smart Cinema film",
            HallName = hall?.Name ?? "Cinema hall",
            SeatLabel = !string.IsNullOrWhiteSpace(ticket.SeatLabel)
                ? ticket.SeatLabel
                : reservation?.SeatLabel ?? "Not recorded",
            StartsAtUtc = screening.StartsAtUtc,
            PricePaid = ticket.PricePaid,
            PaymentMethod = ticket.PaymentMethod,
            PurchasedAtUtc = DateTime.SpecifyKind(ticket.PurchasedAtUtc, DateTimeKind.Utc),
        };
    }

    public Task<bool> HasTicketForReservationAsync(
        Guid reservationId,
        Guid userId,
        CancellationToken token
    ) =>
        db.TicketPurchases.AnyAsync(
            ticket => ticket.ReservationId == reservationId && ticket.UserId == userId,
            token
        );

    public async Task<TicketValidationResponseDto> ValidateEntryAsync(
        TicketValidationRequestDto request,
        CancellationToken token
    )
    {
        const string prefix = "SMART-CINEMA|";
        var ticketNumber = request.Code.Trim();
        if (ticketNumber.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            ticketNumber = ticketNumber[prefix.Length..];

        var ticket = await db.TicketPurchases.SingleOrDefaultAsync(
            item => item.TicketNumber == ticketNumber,
            token
        );
        if (ticket is null)
            return new TicketValidationResponseDto { Message = "Ticket was not found." };
        if (ticket.Status == TicketStatus.Used)
            return new TicketValidationResponseDto
            {
                TicketNumber = ticket.TicketNumber,
                Message = "This ticket has already been used.",
            };
        if (ticket.Status != TicketStatus.Valid)
            return new TicketValidationResponseDto
            {
                TicketNumber = ticket.TicketNumber,
                Message = "This ticket is not valid for entry.",
            };

        ticket.Status = TicketStatus.Used;
        await db.SaveChangesAsync(token);
        return new TicketValidationResponseDto
        {
            IsValid = true,
            TicketNumber = ticket.TicketNumber,
            Message = "Ticket validated. Entry is allowed.",
        };
    }

    private static async Task<T?> GetFromGatewayAsync<T>(
        HttpClient gateway,
        string path,
        string? authorizationHeader,
        CancellationToken token
    )
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        if (!string.IsNullOrWhiteSpace(authorizationHeader))
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);

        using var response = await gateway.SendAsync(request, token);
        if (!response.IsSuccessStatusCode)
            return default;

        return await response.Content.ReadFromJsonAsync<T>(cancellationToken: token);
    }

    private static TicketPurchaseResponseDto Map(TicketPurchase purchase) =>
        new()
        {
            Id = purchase.Id,
            ReservationId = purchase.ReservationId,
            ScreeningId = purchase.ScreeningId,
            PaymentId = purchase.PaymentId,
            PaymentMethod = purchase.PaymentMethod,
            Status = purchase.Status,
            SeatLabel = purchase.SeatLabel,
            TicketNumber = purchase.TicketNumber,
            PricePaid = purchase.PricePaid,
            PurchasedAtUtc = DateTime.SpecifyKind(purchase.PurchasedAtUtc, DateTimeKind.Utc),
        };

    private static async Task<bool> ConfirmReservationAsync(
        HttpClient gateway,
        string authorizationHeader,
        Guid reservationId,
        CancellationToken token
    )
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Put,
            $"api/reservations/{reservationId}/confirm"
        );
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);

        using var response = await gateway.SendAsync(request, token);
        return response.IsSuccessStatusCode;
    }

    private static async Task<PaymentTransactionResponseDto> AuthorizePaymentAsync(
        HttpClient gateway,
        string authorizationHeader,
        PaymentAuthorizationRequestDto payment,
        CancellationToken token
    )
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/payments/authorize")
        {
            Content = JsonContent.Create(payment),
        };
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);

        using var response = await gateway.SendAsync(request, token);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException("The payment service is temporarily unavailable.");

        return
            await response.Content.ReadFromJsonAsync<PaymentTransactionResponseDto>(
                cancellationToken: token
            ) ?? throw new InvalidOperationException("The payment service returned an invalid response.");
    }

    private static async Task<PaymentTransactionResponseDto> UpdatePaymentAsync(
        HttpClient gateway,
        string authorizationHeader,
        Guid paymentId,
        string action,
        CancellationToken token
    )
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Put,
            $"api/payments/{paymentId}/{action}"
        );
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);

        using var response = await gateway.SendAsync(request, token);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException("The payment service is temporarily unavailable.");

        return
            await response.Content.ReadFromJsonAsync<PaymentTransactionResponseDto>(
                cancellationToken: token
            ) ?? throw new InvalidOperationException("The payment service returned an invalid response.");
    }

    private static async Task VoidPaymentAsync(
        HttpClient gateway,
        string authorizationHeader,
        Guid paymentId,
        CancellationToken token
    )
    {
        try
        {
            await UpdatePaymentAsync(gateway, authorizationHeader, paymentId, "void", token);
        }
        catch (Exception exception) when (
            exception is HttpRequestException or InvalidOperationException
        )
        {
            // The failed compensation remains visible as an authorized payment for later handling.
        }
    }
}
