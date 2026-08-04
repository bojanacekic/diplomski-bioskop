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
if (jwtSecret.Length < 32)
    throw new InvalidOperationException("Jwt:SecretKey must contain at least 32 characters.");
var gatewayBaseUrl =
    builder.Configuration["Services:GatewayBaseUrl"]
    ?? builder.Configuration["Services__GatewayBaseUrl"]
    ?? throw new InvalidOperationException("Services:GatewayBaseUrl is not configured.");

builder.WebHost.UseUrls(ticketsUrl);
builder.Services.AddDbContext<TicketsDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddScoped<ITicketPurchaseService, TicketPurchaseService>();
builder.Services.AddSingleton<TicketPdfService>();
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
builder.Services.AddAuthorization(options =>
    options.AddPolicy(
        "BoxOfficeSales",
        policy => policy.RequireRole("CinemaManager", "Administrator")
    )
);
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

app.MapGet(
        "/api/tickets",
        async (ITicketPurchaseService service, CancellationToken token) =>
            Results.Ok(await service.GetAllAsync(token))
    )
    .RequireAuthorization("BoxOfficeSales");

app.MapGet(
        "/api/tickets/reservations/{reservationId:guid}/exists",
        async (
            Guid reservationId,
            ClaimsPrincipal user,
            ITicketPurchaseService service,
            CancellationToken token
        ) =>
            Results.Ok(
                await service.HasTicketForReservationAsync(
                    reservationId,
                    CurrentUserId(user),
                    token
                )
            )
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
                return Results.Created($"/api/tickets/{ticket[0].Id}", ticket);
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

app.MapPost(
        "/api/tickets/box-office",
        async (
            CashTicketPurchaseRequestDto request,
            HttpRequest httpRequest,
            ITicketPurchaseService service,
            CancellationToken token
        ) =>
        {
            var errors = CashTicketPurchaseValidator.Validate(request);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            try
            {
                var ticket = await service.PurchaseAtBoxOfficeAsync(
                    httpRequest.Headers.Authorization.ToString(),
                    request,
                    token
                );
                return Results.Created($"/api/tickets/{ticket[0].Id}", ticket);
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
    .RequireAuthorization("BoxOfficeSales");

app.MapPost(
        "/api/tickets/validate-entry",
        async (
            TicketValidationRequestDto request,
            ITicketPurchaseService service,
            CancellationToken token
        ) =>
        {
            var errors = TicketValidationValidator.Validate(request);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            return Results.Ok(await service.ValidateEntryAsync(request, token));
        }
    )
    .RequireAuthorization("BoxOfficeSales");

app.MapDelete(
        "/api/tickets/{id:guid}",
        async (
            Guid id,
            HttpRequest httpRequest,
            ClaimsPrincipal user,
            ITicketPurchaseService service,
            CancellationToken token
        ) =>
        {
            try
            {
                var ticket = await service.CancelAsync(
                    id,
                    CurrentUserId(user),
                    httpRequest.Headers.Authorization.ToString(),
                    token
                );
                return ticket is null ? Results.NotFound() : Results.Ok(ticket);
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        }
    )
    .RequireAuthorization();

app.MapGet(
        "/api/tickets/{id:guid}/pdf",
        async (
            Guid id,
            HttpRequest httpRequest,
            ClaimsPrincipal user,
            ITicketPurchaseService service,
            TicketPdfService ticketPdfService,
            CancellationToken token
        ) =>
        {
            var ticket = await service.GetPdfDataAsync(
                id,
                CurrentUserId(user),
                httpRequest.Headers.Authorization.ToString(),
                token
            );
            if (ticket is null)
                return Results.NotFound();

            var fileName = $"smart-cinema-ticket-{ticket.TicketNumber}.pdf";
            return Results.File(
                ticketPdfService.Create(ticket),
                "application/pdf",
                fileName
            );
        }
    )
    .RequireAuthorization();

app.MapGet(
        "/api/tickets/{id:guid}/receipt",
        async (
            Guid id,
            HttpRequest httpRequest,
            ClaimsPrincipal user,
            ITicketPurchaseService service,
            TicketPdfService ticketPdfService,
            CancellationToken token
        ) =>
        {
            var tickets = await service.GetReceiptDataAsync(
                id,
                CurrentUserId(user),
                httpRequest.Headers.Authorization.ToString(),
                token
            );
            if (tickets.Count == 0)
                return Results.NotFound();

            var fileName = $"smart-cinema-receipt-{tickets[0].TicketNumber}.pdf";
            return Results.File(ticketPdfService.CreateReceipt(tickets), "application/pdf", fileName);
        }
    )
    .RequireAuthorization();

app.Run();
