using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AuthMicroservice.Domain;
using AuthMicroservice.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthMicroservice.WebAPI.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController(IUserManagementService users) : ControllerBase
{
    private Guid CurrentUserId()
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(userId, out var id) ? id : throw new UnauthorizedAccessException();
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken t) =>
        (await users.GetAsync(CurrentUserId(), t)) is { } u ? Ok(u) : NotFound();

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileRequestDto r, CancellationToken t)
    {
        try
        {
            return (await users.UpdateProfileAsync(CurrentUserId(), r, t)) is { } u
                ? Ok(u)
                : NotFound();
        }
        catch (Exception e) when (e is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangeMyPassword(ChangePasswordRequestDto request, CancellationToken t)
    {
        try
        {
            await users.ChangePasswordAsync(CurrentUserId(), request, t);
            return NoContent();
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Search(string? search, CancellationToken t) =>
        Ok(await users.SearchAsync(search, t));

    [HttpGet("{id:guid}/reservation-customer")]
    [Authorize(Roles = "CinemaManager,Administrator")]
    public async Task<IActionResult> ReservationCustomer(Guid id, CancellationToken t)
    {
        var user = await users.GetAsync(id, t);

        return user is null
            ? NotFound()
            : Ok(
                new ReservationCustomerResponseDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                }
            );
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Update(Guid id, UpdateProfileRequestDto r, CancellationToken t)
    {
        try
        {
            return (await users.UpdateProfileAsync(id, r, t)) is { } u ? Ok(u) : NotFound();
        }
        catch (Exception e) when (e is ArgumentException or InvalidOperationException)
        {
            return BadRequest(new { message = e.Message });
        }
    }

    [HttpPatch("{id:guid}/role")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Role(
        Guid id,
        ChangeUserRoleRequestDto r,
        CancellationToken t
    ) => (await users.ChangeRoleAsync(id, r.Role, t)) is { } u ? Ok(u) : NotFound();

    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken t) =>
        await users.DeactivateAsync(id, t) ? NoContent() : NotFound();

    [HttpPatch("{id:guid}/activate")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken t)
    {
        try
        {
            return await users.ActivateAsync(id, t) ? NoContent() : NotFound();
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}
