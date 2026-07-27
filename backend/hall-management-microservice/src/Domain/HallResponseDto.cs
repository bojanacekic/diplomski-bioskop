namespace Halls.Domain;

public sealed class HallResponseDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public HallType Type { get; init; }
    public int Rows { get; init; }
    public int SeatsPerRow { get; init; }
    public int Capacity { get; init; }
    public bool IsActive { get; init; }
}
