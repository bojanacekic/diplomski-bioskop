using Halls.Database;
using Halls.Domain;
using Microsoft.EntityFrameworkCore;

namespace Halls.Services;

public sealed class HallService(HallsDbContext db) : IHallService
{
    public async Task<IReadOnlyList<HallResponseDto>> GetAsync(
        string? search,
        CancellationToken token
    )
    {
        var query = db.Halls.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var matchingTypes = Enum.GetValues<HallType>()
                .Where(type =>
                    GetTypeLabel(type).Contains(term, StringComparison.OrdinalIgnoreCase)
                )
                .ToArray();
            query = query.Where(x => x.Name.Contains(term) || matchingTypes.Contains(x.Type));
        }

        return await query.Select(x => Map(x)).ToListAsync(token);
    }

    public async Task<HallResponseDto?> UpdateAsync(
        Guid id,
        UpdateHallRequestDto request,
        CancellationToken token
    )
    {
        var hall = await db.Halls.FirstOrDefaultAsync(x => x.Id == id, token);
        if (hall is null)
            return null;

        hall.Name = request.Name.Trim();
        hall.Type = request.Type;
        hall.Rows = request.Rows;
        hall.SeatsPerRow = request.SeatsPerRow;
        await db.SaveChangesAsync(token);
        return Map(hall);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken token)
    {
        var hall = await db.Halls.FirstOrDefaultAsync(x => x.Id == id, token);
        if (hall is null)
            return false;

        db.Halls.Remove(hall);
        await db.SaveChangesAsync(token);
        return true;
    }

    public async Task<HallResponseDto> CreateAsync(
        CreateHallRequestDto request,
        CancellationToken token
    )
    {
        var hall = new Hall
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Type = request.Type,
            Rows = request.Rows,
            SeatsPerRow = request.SeatsPerRow,
        };
        db.Halls.Add(hall);
        await db.SaveChangesAsync(token);
        return Map(hall);
    }

    private static string GetTypeLabel(HallType type) =>
        type switch
        {
            HallType.ThreeDimensional => "3D",
            _ => type.ToString(),
        };

    private static HallResponseDto Map(Hall hall) =>
        new()
        {
            Id = hall.Id,
            Name = hall.Name,
            Type = hall.Type,
            Rows = hall.Rows,
            SeatsPerRow = hall.SeatsPerRow,
            Capacity = hall.Rows * hall.SeatsPerRow,
            IsActive = hall.IsActive,
        };
}
