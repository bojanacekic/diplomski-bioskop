using Reservations.Domain;

namespace Reservations.WebAPI.Validators;

public static class ReservationValidator
{
    public static Dictionary<string, string[]> Validate(CreateReservationRequestDto request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.ScreeningId == Guid.Empty)
            errors["screeningId"] = ["Screening is required."];
        if (string.IsNullOrWhiteSpace(request.SeatLabel) || request.SeatLabel.Trim().Length > 10)
            errors["seatLabel"] = ["Seat label is required and can contain at most 10 characters."];
        return errors;
    }
}
