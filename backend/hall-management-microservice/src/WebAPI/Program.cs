using System.Text;
using Halls.Database;
using Halls.Domain;
using Halls.Services;
using Halls.WebAPI.Validators;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

DotEnvReader.Load();
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
var connection =
    builder.Configuration.GetConnectionString("HallsDatabase")
    ?? throw new InvalidOperationException("ConnectionStrings__HallsDatabase is not configured.");
builder.WebHost.UseUrls(builder.Configuration["Halls:Url"] ?? "http://localhost:5003");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? builder.Configuration["Jwt__Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? builder.Configuration["Jwt__Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"] ?? builder.Configuration["Jwt__SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
builder.Services.AddDbContext<HallsDbContext>(o => o.UseSqlServer(connection));
builder.Services.AddScoped<IHallService, HallService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters { ValidateIssuer = true, ValidIssuer = jwtIssuer, ValidateAudience = true, ValidAudience = jwtAudience, ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)), ValidateLifetime = true });
builder.Services.AddAuthorization(options => options.AddPolicy("HallManagement", policy => policy.RequireRole("CinemaManager", "Administrator")));
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p =>
        p.WithOrigins(builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    )
);
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<HallsDbContext>().Database;
    await database.ExecuteSqlRawAsync("""
        IF OBJECT_ID(N'[Halls]') IS NOT NULL
        BEGIN
            IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
                CREATE TABLE [__EFMigrationsHistory] ([MigrationId] nvarchar(150) NOT NULL PRIMARY KEY, [ProductVersion] nvarchar(32) NOT NULL);
            IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260727212337_InitialCreate')
                INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260727212337_InitialCreate', N'8.0.28');
        END
        """);
    await database.MigrateAsync();
}
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapGet(
    "/api/halls",
    async (string? search, IHallService service, CancellationToken token) =>
        Results.Ok(await service.GetAsync(search, token))
);
app.MapPost(
    "/api/halls",
    async (CreateHallRequestDto request, IHallService service, CancellationToken token) =>
    {
        var errors = HallValidator.Validate(request);
        if (errors.Count > 0)
            return Results.ValidationProblem(errors);
        return Results.Created("/api/halls", await service.CreateAsync(request, token));
    }
).RequireAuthorization("HallManagement");
app.MapPut(
    "/api/halls/{id:guid}",
    async (Guid id, UpdateHallRequestDto request, IHallService service, CancellationToken token) =>
    {
        var errors = HallValidator.Validate(request);
        if (errors.Count > 0)
            return Results.ValidationProblem(errors);
        var hall = await service.UpdateAsync(id, request, token);
        return hall is null ? Results.NotFound() : Results.Ok(hall);
    }
).RequireAuthorization("HallManagement");
app.MapDelete(
    "/api/halls/{id:guid}",
    async (Guid id, IHallService service, CancellationToken token) =>
        await service.DeleteAsync(id, token) ? Results.NoContent() : Results.NotFound()
).RequireAuthorization("HallManagement");
app.Run();
