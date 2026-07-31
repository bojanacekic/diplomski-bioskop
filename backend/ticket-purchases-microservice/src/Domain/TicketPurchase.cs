namespace TicketPurchases.Domain;

public sealed class TicketPurchase
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ReservationId { get; set; }
    public Guid ScreeningId { get; set; }
    public Guid? PaymentId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.OnlineCard;
    public string SeatLabel { get; set; } = string.Empty;
    public string TicketNumber { get; set; } = string.Empty;
    public decimal PricePaid { get; set; }
    public DateTime PurchasedAtUtc { get; set; }
}
