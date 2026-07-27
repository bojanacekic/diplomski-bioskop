using Screenings.Domain;

namespace Screenings.WebAPI.Validators;

public static class ScreeningValidator
{
    public static Dictionary<string, string[]> Validate(CreateScreeningRequestDto r) =>
        Validate(r.MovieId, r.HallId, r.StartsAtUtc, r.EndsAtUtc, r.BaseTicketPrice, r.Status);

    public static Dictionary<string, string[]> Validate(UpdateScreeningRequestDto r) =>
        Validate(r.MovieId, r.HallId, r.StartsAtUtc, r.EndsAtUtc, r.BaseTicketPrice, r.Status);

    private static Dictionary<string, string[]> Validate(
        Guid movieId,
        Guid hallId,
        DateTime start,
        DateTime end,
        decimal price,
        ScreeningStatus status
    )
    {
        var e = new Dictionary<string, string[]>();
        if (movieId == Guid.Empty)
            e["movieId"] = ["Movie is required."];
        if (hallId == Guid.Empty)
            e["hallId"] = ["Hall is required."];
        if (end <= start)
            e["endsAtUtc"] = ["End time must be after start time."];
        if (price <= 0)
            e["baseTicketPrice"] = ["Base ticket price must be greater than zero."];
        if (!Enum.IsDefined(status))
            e["status"] = ["Screening status is invalid."];
        return e;
    }
}
