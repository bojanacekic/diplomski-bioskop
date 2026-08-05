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

    public async Task<IReadOnlyList<TicketPurchaseResponseDto>> PurchaseAsync(
        Guid userId,
        string authorizationHeader,
        PurchaseTicketRequestDto request,
        CancellationToken token
    )
    {
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
        var reservationGroup = GetReservationGroup(reservations, reservation);
        if (reservationGroup.Any(item => item.Status != 1))
            throw new InvalidOperationException("All seats in this reservation must be purchased together.");
        if (await db.TicketPurchases.AnyAsync(ticket => reservationGroup.Select(item => item.Id).Contains(ticket.ReservationId) && ticket.Status != TicketStatus.Cancelled, token))
            throw new InvalidOperationException("A ticket has already been purchased for this reservation.");

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
                Amount = screening.BaseTicketPrice * reservationGroup.Count,
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

        var purchases = CreatePurchases(reservationGroup, PaymentMethod.OnlineCard, payment.Id, screening.BaseTicketPrice);
        db.TicketPurchases.AddRange(purchases);
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
            db.TicketPurchases.RemoveRange(purchases);
            await db.SaveChangesAsync(token);
            await VoidPaymentAsync(gateway, authorizationHeader, payment.Id, token);
            throw new InvalidOperationException(
                "Ticket purchase could not be completed. The payment was voided."
            );
        }

        if (!await ConfirmReservationsAsync(gateway, authorizationHeader, reservationGroup.Select(item => item.Id), token))
            throw new InvalidOperationException("The ticket was issued, but its reservation could not be confirmed.");

        return purchases.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<TicketPurchaseResponseDto>> GetAllAsync(CancellationToken token)
    {
        var purchases = await db.TicketPurchases
            .AsNoTracking()
            .OrderByDescending(ticket => ticket.PurchasedAtUtc)
            .ToListAsync(token);

        return purchases.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<TicketPurchaseResponseDto>> PurchaseAtBoxOfficeAsync(
        string authorizationHeader,
        CashTicketPurchaseRequestDto request,
        CancellationToken token
    )
    {
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
        var reservationGroup = GetReservationGroup(reservations, reservation);
        if (reservationGroup.Any(item => item.Status != 1))
            throw new InvalidOperationException("All seats in this reservation must be purchased together.");
        if (await db.TicketPurchases.AnyAsync(ticket => reservationGroup.Select(item => item.Id).Contains(ticket.ReservationId) && ticket.Status != TicketStatus.Cancelled, token))
            throw new InvalidOperationException("A ticket has already been purchased for this reservation.");

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

        var purchases = CreatePurchases(reservationGroup, PaymentMethod.CashAtBoxOffice, null, screening.BaseTicketPrice);
        db.TicketPurchases.AddRange(purchases);
        try
        {
            await db.SaveChangesAsync(token);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException("A ticket has already been purchased for this reservation.");
        }

        if (!await ConfirmReservationsAsync(gateway, authorizationHeader, reservationGroup.Select(item => item.Id), token))
            throw new InvalidOperationException("The ticket was issued, but its reservation could not be confirmed.");

        return purchases.Select(Map).ToList();
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
            ticket =>
                ticket.ReservationId == reservationId
                && ticket.UserId == userId
                && ticket.Status != TicketStatus.Cancelled,
            token
        );

    public async Task<IReadOnlyList<TicketPdfDataDto>> GetReceiptDataAsync(
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
            return [];

        var tickets = ticket.PurchaseId.HasValue
            ? await db.TicketPurchases.AsNoTracking()
                .Where(item => item.PurchaseId == ticket.PurchaseId && item.UserId == userId)
                .OrderBy(item => item.SeatLabel)
                .ToListAsync(token)
            : new List<TicketPurchase> { ticket };
        var result = new List<TicketPdfDataDto>();
        foreach (var purchase in tickets)
        {
            var data = await GetPdfDataAsync(purchase.Id, userId, authorizationHeader, token);
            if (data is not null)
                result.Add(data);
        }
        return result;
    }

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

    public async Task<IReadOnlyList<TicketPurchaseResponseDto>?> CancelAsync(
        Guid ticketId,
        Guid userId,
        string authorizationHeader,
        CancellationToken token
    )
    {
        var ticket = await db.TicketPurchases.SingleOrDefaultAsync(
            item => item.Id == ticketId && item.UserId == userId,
            token
        );
        if (ticket is null)
            return null;
        var purchaseTickets = await GetPurchaseTicketsAsync(ticket, token);
        if (purchaseTickets.Any(item => item.Status == TicketStatus.Used))
            throw new InvalidOperationException("A used ticket cannot be cancelled.");
        if (purchaseTickets.All(item => item.Status == TicketStatus.Cancelled))
        {
            var cancelledTicketGateway = httpClientFactory.CreateClient("Gateway");
            if (!await CancelReservationsAsync(cancelledTicketGateway, authorizationHeader, purchaseTickets.Select(item => item.ReservationId), token))
                throw new InvalidOperationException("This ticket has already been cancelled.");

            return purchaseTickets.Select(Map).ToList();
        }

        var gateway = httpClientFactory.CreateClient("Gateway");
        var screening = await GetFromGatewayAsync<ScreeningDetailsDto>(
            gateway,
            $"api/screenings/{ticket.ScreeningId}",
            null,
            token
        );
        if (screening is null)
            throw new InvalidOperationException("The screening could not be found.");
        if (DateTime.SpecifyKind(screening.StartsAtUtc, DateTimeKind.Utc) <= DateTime.UtcNow)
            throw new InvalidOperationException("Tickets can only be cancelled before the screening starts.");

        if (ticket.PaymentMethod == PaymentMethod.OnlineCard)
        {
            if (!ticket.PaymentId.HasValue)
                throw new InvalidOperationException("Online payment information is unavailable.");

            var refund = await UpdatePaymentAsync(
                gateway,
                authorizationHeader,
                ticket.PaymentId.Value,
                "refund",
                token
            );
            if (refund.Status != 5)
                throw new InvalidOperationException("The online payment could not be refunded.");
        }

        foreach (var purchaseTicket in purchaseTickets)
            purchaseTicket.Status = TicketStatus.Cancelled;
        await db.SaveChangesAsync(token);

        if (!await CancelReservationsAsync(gateway, authorizationHeader, purchaseTickets.Select(item => item.ReservationId), token))
            throw new InvalidOperationException(
                "The ticket was cancelled, but the reservation could not be released."
            );

        return purchaseTickets.Select(Map).ToList();
    }

    public async Task<int> DeleteForScreeningAsync(
        Guid screeningId,
        string authorizationHeader,
        CancellationToken token
    )
    {
        var tickets = await db.TicketPurchases
            .Where(item => item.ScreeningId == screeningId && item.Status != TicketStatus.Cancelled)
            .ToListAsync(token);
        if (tickets.Any(item => item.Status == TicketStatus.Used))
            throw new InvalidOperationException("A screening with used tickets cannot be deleted.");

        var gateway = httpClientFactory.CreateClient("Gateway");
        foreach (var paymentId in tickets
            .Where(item => item.PaymentMethod == PaymentMethod.OnlineCard && item.PaymentId.HasValue)
            .Select(item => item.PaymentId!.Value)
            .Distinct())
        {
            var refund = await UpdatePaymentAsync(gateway, authorizationHeader, paymentId, "refund", token);
            if (refund.Status != 5)
                throw new InvalidOperationException("An online ticket payment could not be refunded.");
        }

        db.TicketPurchases.RemoveRange(tickets);
        await db.SaveChangesAsync(token);
        return tickets.Count;
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
            PurchaseId = purchase.PurchaseId,
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

    private static async Task<bool> ConfirmReservationsAsync(
        HttpClient gateway,
        string authorizationHeader,
        IEnumerable<Guid> reservationIds,
        CancellationToken token
    )
    {
        foreach (var reservationId in reservationIds)
            if (!await ConfirmReservationAsync(gateway, authorizationHeader, reservationId, token))
                return false;
        return true;
    }

    private static async Task<bool> CancelReservationAsync(
        HttpClient gateway,
        string authorizationHeader,
        Guid reservationId,
        CancellationToken token
    )
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Delete,
            $"api/reservations/{reservationId}"
        );
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(authorizationHeader);

        using var response = await gateway.SendAsync(request, token);
        return response.IsSuccessStatusCode;
    }

    private static async Task<bool> CancelReservationsAsync(
        HttpClient gateway,
        string authorizationHeader,
        IEnumerable<Guid> reservationIds,
        CancellationToken token
    )
    {
        var reservationId = reservationIds.FirstOrDefault();
        return reservationId != Guid.Empty
            && await CancelReservationAsync(gateway, authorizationHeader, reservationId, token);
    }

    private static List<ReservationDetailsDto> GetReservationGroup(
        List<ReservationDetailsDto>? reservations,
        ReservationDetailsDto reservation
    ) => reservation.ReservationGroupId.HasValue
        ? reservations!
            .Where(item => item.ReservationGroupId == reservation.ReservationGroupId)
            .ToList()
        : new List<ReservationDetailsDto> { reservation };

    private static List<TicketPurchase> CreatePurchases(
        IEnumerable<ReservationDetailsDto> reservations,
        PaymentMethod paymentMethod,
        Guid? paymentId,
        decimal price
    )
    {
        var purchaseId = Guid.NewGuid();
        var purchasedAt = DateTime.UtcNow;
        return reservations.Select(reservation => new TicketPurchase
            {
                Id = Guid.NewGuid(),
                PurchaseId = purchaseId,
                UserId = reservation.UserId,
                ReservationId = reservation.Id,
                ScreeningId = reservation.ScreeningId,
                SeatLabel = reservation.SeatLabel,
                PaymentId = paymentId,
                PaymentMethod = paymentMethod,
                TicketNumber = $"SC-{Guid.NewGuid():N}"[..15].ToUpperInvariant(),
                PricePaid = price,
                PurchasedAtUtc = purchasedAt,
            })
            .ToList();
    }

    private Task<List<TicketPurchase>> GetPurchaseTicketsAsync(
        TicketPurchase ticket,
        CancellationToken token
    ) => ticket.PurchaseId.HasValue
        ? db.TicketPurchases.Where(item => item.PurchaseId == ticket.PurchaseId).ToListAsync(token)
        : Task.FromResult(new List<TicketPurchase> { ticket });

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
