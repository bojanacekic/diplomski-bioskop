using Payments.Domain;

namespace Payments.Services;

public interface IPaymentService
{
    Task<IReadOnlyList<PaymentResponseDto>> GetForUserAsync(Guid userId, CancellationToken token);
    Task<PaymentResponseDto> AuthorizeAsync(
        Guid userId,
        AuthorizePaymentRequestDto request,
        CancellationToken token
    );
    Task<PaymentResponseDto?> CaptureAsync(Guid id, Guid userId, CancellationToken token);
    Task<PaymentResponseDto?> VoidAsync(Guid id, Guid userId, CancellationToken token);
    Task<PaymentResponseDto?> RefundAsync(Guid id, Guid userId, CancellationToken token);
}
