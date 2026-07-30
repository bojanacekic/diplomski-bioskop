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

        var purchase = new TicketPurchase
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ReservationId = reservation.Id,
            ScreeningId = reservation.ScreeningId,
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

        return Map(purchase);
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
            TicketNumber = purchase.TicketNumber,
            PricePaid = purchase.PricePaid,
            PurchasedAtUtc = DateTime.SpecifyKind(purchase.PurchasedAtUtc, DateTimeKind.Utc),
        };
}
