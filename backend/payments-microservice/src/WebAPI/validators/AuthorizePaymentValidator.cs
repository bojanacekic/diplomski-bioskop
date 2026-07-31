using System.Text.RegularExpressions;
using Payments.Domain;

namespace Payments.WebAPI.Validators;

public static partial class AuthorizePaymentValidator
{
    public static Dictionary<string, string[]> Validate(AuthorizePaymentRequestDto request)
    {
        var errors = new Dictionary<string, string[]>();
        var cardNumber = request.CardNumber.Replace(" ", string.Empty).Replace("-", string.Empty);

        if (request.ReservationId == Guid.Empty)
            errors["reservationId"] = ["Reservation is required."];
        if (request.Amount <= 0)
            errors["amount"] = ["Payment amount must be greater than zero."];
        if (string.IsNullOrWhiteSpace(request.CardholderName))
            errors["cardholderName"] = ["Cardholder name is required."];
        if (!CardNumberPattern().IsMatch(cardNumber))
            errors["cardNumber"] = ["Enter a valid test card number."];
        if (!ExpiryDatePattern().IsMatch(request.ExpiryDate))
        {
            errors["expiryDate"] = ["Use the MM/YY expiry date format."];
        }
        else
        {
            var month = int.Parse(request.ExpiryDate[..2]);
            var year = int.Parse(request.ExpiryDate[3..]);
            if (year < 26 || (year == 26 && month < 7))
                errors["expiryDate"] = ["Expiry date format is invalid."];
        }
        if (!CvvPattern().IsMatch(request.Cvv))
            errors["cvv"] = ["CVV must contain 3 or 4 digits."];

        return errors;
    }

    [GeneratedRegex("^\\d{13,19}$")]
    private static partial Regex CardNumberPattern();

    [GeneratedRegex("^(0[1-9]|1[0-2])/\\d{2}$")]
    private static partial Regex ExpiryDatePattern();

    [GeneratedRegex("^\\d{3,4}$")]
    private static partial Regex CvvPattern();
}
