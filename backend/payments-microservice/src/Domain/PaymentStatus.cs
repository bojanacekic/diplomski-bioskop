namespace Payments.Domain;

public enum PaymentStatus
{
    Authorized = 1,
    Captured = 2,
    Voided = 3,
    Declined = 4,
    Refunded = 5,
}
