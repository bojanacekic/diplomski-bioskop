namespace Screenings.Domain;

public sealed class Screening
{
    public Guid Id { get; set; }
    public Guid MovieId { get; set; }
    public Guid HallId { get; set; }
    public DateTime StartsAtUtc { get; set; }
    public DateTime EndsAtUtc { get; set; }
    public decimal BaseTicketPrice { get; set; }
    public ScreeningStatus Status { get; set; } = ScreeningStatus.Scheduled;
    public DateTime CreatedAtUtc { get; set; }
}
