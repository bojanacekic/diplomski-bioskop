using AuthMicroservice.Domain;
using AuthMicroservice.Services;
using Microsoft.AspNetCore.Mvc;

namespace AuthMicroservice.WebAPI.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        RegisterUserRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var result = await authService.RegisterAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            return Conflict(new ProblemDetails { Detail = result.Error });
        }

        return Created("api/auth/register", result.Response);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        LoginRequestDto request,
        CancellationToken cancellationToken
    )
    {
        var result = await authService.LoginAsync(request, cancellationToken);
        if (!result.IsSuccess)
        {
            return Unauthorized(new ProblemDetails { Detail = result.Error });
        }

        return Ok(result.Response);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(
        ForgotPasswordRequestDto request,
        CancellationToken cancellationToken
    )
    {
        await authService.RequestPasswordResetAsync(request, cancellationToken);
        return Accepted(
            new { message = "If the account exists, a password reset link has been sent." }
        );
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(
        ResetPasswordRequestDto request,
        CancellationToken cancellationToken
    ) =>
        await authService.ResetPasswordAsync(request, cancellationToken)
            ? NoContent()
            : BadRequest(new ProblemDetails { Detail = "The password reset link is invalid or has expired." });
}
