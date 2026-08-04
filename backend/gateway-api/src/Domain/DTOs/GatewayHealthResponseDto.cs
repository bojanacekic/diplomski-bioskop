namespace GatewayApi.Domain.DTOs;

public sealed class GatewayHealthResponseDto
{
    public string Status { get; init; } = string.Empty;
    public Guid InstanceId { get; init; }
    public DateTime CheckedAtUtc { get; init; }
}
