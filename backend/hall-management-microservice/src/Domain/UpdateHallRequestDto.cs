namespace Halls.Domain;
public sealed class UpdateHallRequestDto { public string Name { get; init; } = string.Empty; public HallType Type { get; init; } public int Rows { get; init; } public int SeatsPerRow { get; init; } }
