using System.IdentityModel.Tokens.Jwt; using AuthMicroservice.Domain; using AuthMicroservice.Services; using Microsoft.AspNetCore.Authorization; using Microsoft.AspNetCore.Mvc;
namespace AuthMicroservice.WebAPI.Controllers;
[ApiController][Route("api/users")][Authorize]
public sealed class UsersController(IUserManagementService users):ControllerBase { private Guid CurrentUserId()=>Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value??throw new UnauthorizedAccessException());
 [HttpGet("me")] public async Task<IActionResult> Me(CancellationToken t)=> (await users.GetAsync(CurrentUserId(),t)) is { } u?Ok(u):NotFound();
 [HttpPut("me")] public async Task<IActionResult> UpdateMe(UpdateProfileRequestDto r,CancellationToken t){try{return (await users.UpdateProfileAsync(CurrentUserId(),r,t)) is { } u?Ok(u):NotFound();}catch(Exception e)when(e is ArgumentException or InvalidOperationException){return BadRequest(new{message=e.Message});}}
 [HttpGet][Authorize(Roles="Administrator")] public async Task<IActionResult> Search(string? search,CancellationToken t)=>Ok(await users.SearchAsync(search,t));
 [HttpPut("{id:guid}")][Authorize(Roles="Administrator")] public async Task<IActionResult> Update(Guid id,UpdateProfileRequestDto r,CancellationToken t){try{return (await users.UpdateProfileAsync(id,r,t)) is { } u?Ok(u):NotFound();}catch(Exception e)when(e is ArgumentException or InvalidOperationException){return BadRequest(new{message=e.Message});}}
 [HttpPatch("{id:guid}/role")][Authorize(Roles="Administrator")] public async Task<IActionResult> Role(Guid id,ChangeUserRoleRequestDto r,CancellationToken t)=> (await users.ChangeRoleAsync(id,r.Role,t)) is { } u?Ok(u):NotFound();
 [HttpPatch("{id:guid}/deactivate")][Authorize(Roles="Administrator")] public async Task<IActionResult> Deactivate(Guid id,CancellationToken t)=>await users.DeactivateAsync(id,t)?NoContent():NotFound(); }
