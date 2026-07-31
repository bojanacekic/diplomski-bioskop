using TicketPurchases.Domain;

namespace TicketPurchases.WebAPI.Validators;

public static class TicketValidationValidator
{
    public static Dictionary<string, string[]> Validate(TicketValidationRequestDto request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.Code))
            errors["code"] = ["Ticket QR code is required."];

        return errors;
    }
}
