using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Payments.Database;
using Payments.Domain;
using Payments.Services;
using Payments.WebAPI.Validators;

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

var paymentsUrl =
    builder.Configuration["Payments:Url"]
    ?? builder.Configuration["Payments__Url"]
    ?? "http://localhost:5007";
var connectionString =
    builder.Configuration.GetConnectionString("PaymentsDatabase")
    ?? builder.Configuration["ConnectionStrings__PaymentsDatabase"]
    ?? throw new InvalidOperationException("Payments database is not configured.");
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

builder.WebHost.UseUrls(paymentsUrl);
builder.Services.AddDbContext<PaymentsDbContext>(options => options.UseSqlServer(connectionString));
builder.Services.AddScoped<IPaymentService, PaymentService>();
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
    await scope.ServiceProvider.GetRequiredService<PaymentsDbContext>().Database.MigrateAsync();
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
        "/api/payments/me",
        async (ClaimsPrincipal user, IPaymentService service, CancellationToken token) =>
            Results.Ok(await service.GetForUserAsync(CurrentUserId(user), token))
    )
    .RequireAuthorization();

app.MapPost(
        "/api/payments/authorize",
        async (
            AuthorizePaymentRequestDto request,
            ClaimsPrincipal user,
            IPaymentService service,
            CancellationToken token
        ) =>
        {
            var errors = AuthorizePaymentValidator.Validate(request);
            if (errors.Count > 0)
                return Results.ValidationProblem(errors);

            return Results.Ok(await service.AuthorizeAsync(CurrentUserId(user), request, token));
        }
    )
    .RequireAuthorization();

app.MapPut(
        "/api/payments/{id:guid}/capture",
        async (Guid id, ClaimsPrincipal user, IPaymentService service, CancellationToken token) =>
            (await service.CaptureAsync(id, CurrentUserId(user), token)) is { } payment
                ? Results.Ok(payment)
                : Results.NotFound()
    )
    .RequireAuthorization();

app.MapPut(
        "/api/payments/{id:guid}/void",
        async (Guid id, ClaimsPrincipal user, IPaymentService service, CancellationToken token) =>
            (await service.VoidAsync(id, CurrentUserId(user), token)) is { } payment
                ? Results.Ok(payment)
                : Results.NotFound()
    )
    .RequireAuthorization();

app.MapPut(
        "/api/payments/{id:guid}/refund",
        async (Guid id, ClaimsPrincipal user, IPaymentService service, CancellationToken token) =>
            (await service.RefundAsync(id, CurrentUserId(user), token)) is { } payment
                ? Results.Ok(payment)
                : Results.NotFound()
    )
    .RequireAuthorization();

app.Run();
