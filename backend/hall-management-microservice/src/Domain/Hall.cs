namespace Halls.Domain;
public sealed class Hall { public Guid Id { get; set; } public string Name { get; set; } = string.Empty; public HallType Type { get; set; } public int Rows { get; set; } public int SeatsPerRow { get; set; } public bool IsActive { get; set; } = true; }
