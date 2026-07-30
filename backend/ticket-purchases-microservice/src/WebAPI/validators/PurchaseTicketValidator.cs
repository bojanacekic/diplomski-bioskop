using TicketPurchases.Domain;

namespace TicketPurchases.WebAPI.Validators;

public static class PurchaseTicketValidator
{
    public static Dictionary<string, string[]> Validate(PurchaseTicketRequestDto request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.ReservationId == Guid.Empty)
            errors["reservationId"] = ["Reservation is required."];

        return errors;
    }
}
