using TicketPurchases.Domain;

namespace TicketPurchases.WebAPI.Validators;

public static class PurchaseTicketValidator
{
    public static Dictionary<string, string[]> Validate(PurchaseTicketRequestDto request)
    {
        var errors = new Dictionary<string, string[]>();
        if (request.ReservationId == Guid.Empty)
            errors["reservationId"] = ["Reservation is required."];
        if (string.IsNullOrWhiteSpace(request.CardholderName))
            errors["cardholderName"] = ["Cardholder name is required."];
        if (
            request.CardNumber.Replace(" ", string.Empty).Replace("-", string.Empty).Length
                is < 13 or > 19
            || request.CardNumber
                .Replace(" ", string.Empty)
                .Replace("-", string.Empty)
                .Any(character => !char.IsDigit(character))
        )
            errors["cardNumber"] = ["Enter a valid test card number."];
        if (
            request.ExpiryDate.Length != 5
            || request.ExpiryDate[2] != '/'
            || !int.TryParse(request.ExpiryDate[..2], out var month)
            || month is < 1 or > 12
            || !int.TryParse(request.ExpiryDate[3..], out _)
        )
            errors["expiryDate"] = ["Use the MM/YY expiry date format."];
        if (request.Cvv.Length is < 3 or > 4 || request.Cvv.Any(character => !char.IsDigit(character)))
            errors["cvv"] = ["CVV must contain 3 or 4 digits."];

        return errors;
    }
}
