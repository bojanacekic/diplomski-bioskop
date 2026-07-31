using Microsoft.EntityFrameworkCore;
using Screenings.Database;
using Screenings.Domain;

namespace Screenings.Services;

public sealed class ScreeningService(ScreeningsDbContext db) : IScreeningService
{
    public async Task<IReadOnlyList<ScreeningResponseDto>> GetAsync(
        DateOnly? date,
        CancellationToken token
    )
    {
        await MarkPastScreeningsAsCompletedAsync(token);
        var query = db.Screenings.AsNoTracking();

        if (date.HasValue)
        {
            var start = date.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(x => x.StartsAtUtc >= start && x.StartsAtUtc < start.AddDays(1));
        }

        return await query.OrderBy(x => x.StartsAtUtc).Select(x => Map(x)).ToListAsync(token);
    }

    public Task<bool> HasOverlapAsync(
        Guid hallId,
        DateTime start,
        DateTime end,
        Guid? excludedId,
        CancellationToken token
    )
    {
        return db.Screenings.AnyAsync(
            x =>
                x.HallId == hallId
                && x.Status != ScreeningStatus.Cancelled
                && (!excludedId.HasValue || x.Id != excludedId.Value)
                && x.StartsAtUtc < end
                && x.EndsAtUtc > start,
            token
        );
    }

    public async Task<ScreeningResponseDto?> GetByIdAsync(Guid id, CancellationToken token)
    {
        await MarkPastScreeningsAsCompletedAsync(token);
        var screening = await db.Screenings.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id, token);
        return screening is null ? null : Map(screening);
    }

    public async Task<ScreeningResponseDto> CreateAsync(
        CreateScreeningRequestDto request,
        CancellationToken token
    )
    {
        var screening = new Screening
        {
            Id = Guid.NewGuid(),
            MovieId = request.MovieId,
            HallId = request.HallId,
            StartsAtUtc = request.StartsAtUtc,
            EndsAtUtc = request.EndsAtUtc,
            BaseTicketPrice = request.BaseTicketPrice,
            Status = StatusFor(request.Status, request.EndsAtUtc),
        };

        db.Screenings.Add(screening);
        await db.SaveChangesAsync(token);
        return Map(screening);
    }

    public async Task<ScreeningResponseDto?> UpdateAsync(
        Guid id,
        UpdateScreeningRequestDto request,
        CancellationToken token
    )
    {
        var screening = await db.Screenings.FirstOrDefaultAsync(x => x.Id == id, token);
        if (screening is null)
            return null;

        screening.MovieId = request.MovieId;
        screening.HallId = request.HallId;
        screening.StartsAtUtc = request.StartsAtUtc;
        screening.EndsAtUtc = request.EndsAtUtc;
        screening.BaseTicketPrice = request.BaseTicketPrice;
        screening.Status = StatusFor(request.Status, request.EndsAtUtc);

        await db.SaveChangesAsync(token);
        return Map(screening);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token)
    {
        var screening = await db.Screenings.FirstOrDefaultAsync(x => x.Id == id, token);
        if (screening is null)
            return false;

        db.Screenings.Remove(screening);
        await db.SaveChangesAsync(token);
        return true;
    }

    private Task MarkPastScreeningsAsCompletedAsync(CancellationToken token) =>
        db.Screenings
            .Where(
                screening =>
                    screening.EndsAtUtc <= DateTime.UtcNow
                    && screening.Status != ScreeningStatus.Completed
                    && screening.Status != ScreeningStatus.Cancelled
            )
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(
                    screening => screening.Status,
                    ScreeningStatus.Completed
                ),
                token
            );

    private static ScreeningStatus StatusFor(ScreeningStatus requestedStatus, DateTime endsAtUtc) =>
        endsAtUtc <= DateTime.UtcNow ? ScreeningStatus.Completed : requestedStatus;

    private static ScreeningResponseDto Map(Screening screening) =>
        new()
        {
            Id = screening.Id,
            MovieId = screening.MovieId,
            HallId = screening.HallId,
            StartsAtUtc = DateTime.SpecifyKind(screening.StartsAtUtc, DateTimeKind.Utc),
            EndsAtUtc = DateTime.SpecifyKind(screening.EndsAtUtc, DateTimeKind.Utc),
            BaseTicketPrice = screening.BaseTicketPrice,
            Status = screening.Status,
        };
}
