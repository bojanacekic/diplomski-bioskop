using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TicketPurchases.Database;
using TicketPurchases.Domain;
using TicketPurchases.Services;
using TicketPurchases.WebAPI.Validators;

DotEnvReader.Load(Path.Combine(Directory.GetCurrentDirectory(), ".env"));
DotEnvReader.Load(
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"))
);
DotEnvReader.Load(
    Path.GetFullPath(
        Path.Combine(Directory.GetCurrentDirectory(), "..", "auth-microservice", ".env")
    )
);
DotEnvReader.Load(
    Path.GetFullPath(
        Path.Combine(
            Directory.GetCurrentDirectory(),
            "..",
            "..",
            "..",
            "auth-microservice",
            ".env"
        )
    )
);

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var ticketsUrl =
    builder.Configuration["Tickets:Url"]
    ?? builder.Configuration["Tickets__Url"]
    ?? "http://localhost:5006";
var connectionString =
    builder.Configuration.GetConnectionString("TicketsDatabase")
    ?? builder.Configuration["ConnectionStrings__TicketsDatabase"]
    ?? throw new InvalidOperationException("Tickets database is not configured.");
var jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? builder.Configuration["Jwt__Issuer"]
    ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience =
    builder.Configuration["Jwt:Audience"]
    ?? builder.Configuration["Jwt__Audience"]
    ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
var jwtSecret =
    builder.Configuration["Jwt:SecretKey"]
    ?? builder.Configuration["Jwt__SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
var gatewayBaseUrl =
    builder.Configuration["Services:GatewayBaseUrl"]
    ?? builder.Configuration["Services__GatewayBaseUrl"]
    ?? throw new InvalidOperationException("Services:GatewayBaseUrl is not configured.");

builder.WebHost.UseUrls(ticketsUrl);
builder.Services.AddDbContext<TicketsDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddScoped<ITicketPurchaseService, TicketPurchaseService>();
builder.Services.AddHttpClient(
    "Gateway",
    client => client.BaseAddress = new Uri($"{gatewayBaseUrl.TrimEnd('/')}/")
);
builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateLifetime = true,
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins(builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    )
);

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<TicketsDbContext>().Database.MigrateAsync();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

Guid CurrentUserId(ClaimsPrincipal user)
{
    var userId =
        user.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
    return Guid.TryParse(userId, out var id) ? id : throw new UnauthorizedAccessException();
}

app.MapGet(
        "/api/tickets/me",
        async (ClaimsPrincipal user, ITicketPurchaseService service, CancellationToken token) =>
            Results.Ok(await service.GetForUserAsync(CurrentUserId(user), token))
    )
    .RequireAuthorization();

app.MapPost(
        "/api/tickets",
        async (
            PurchaseTicketRequestDto request,
            HttpRequest httpRequest,
            ClaimsPrincipal user,
            ITicketPurchaseService service,
            CancellationToken token
        ) =>
        {
            var errors = PurchaseTicketValidator.Validate(request);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            try
            {
                var ticket = await service.PurchaseAsync(
                    CurrentUserId(user),
                    httpRequest.Headers.Authorization.ToString(),
                    request,
                    token
                );
                return Results.Created($"/api/tickets/{ticket.Id}", ticket);
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
            catch (HttpRequestException)
            {
                return Results.Problem(
                    "Reservation information is temporarily unavailable.",
                    statusCode: StatusCodes.Status503ServiceUnavailable
                );
            }
        }
    )
    .RequireAuthorization();

app.Run();
