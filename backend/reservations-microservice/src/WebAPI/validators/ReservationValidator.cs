using Reservations.Domain;

namespace Reservations.WebAPI.Validators;

public static class ReservationValidator
{
    public static Dictionary<string, string[]> Validate(CreateReservationRequestDto request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.ScreeningId == Guid.Empty)
            errors["screeningId"] = ["Screening is required."];
        if (request.SeatLabels.Count == 0)
            errors["seatLabels"] = ["Select at least one seat."];
        if (request.SeatLabels.Any(seat => string.IsNullOrWhiteSpace(seat) || seat.Trim().Length > 10))
            errors["seatLabels"] = ["Every seat label is required and can contain at most 10 characters."];
        return errors;
    }
}
