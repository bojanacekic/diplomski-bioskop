namespace GatewayApi.Domain.DTOs;

public sealed class GatewayHealthResponseDto
{
    public string Status { get; init; } = string.Empty;
    public DateTime CheckedAtUtc { get; init; }
}
