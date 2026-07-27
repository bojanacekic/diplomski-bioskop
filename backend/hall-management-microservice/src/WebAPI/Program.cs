using Halls.Database;
using Halls.Domain;
using Halls.Services;
using Halls.WebAPI.Validators;
using Microsoft.EntityFrameworkCore;

DotEnvReader.Load();
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
var connection =
    builder.Configuration.GetConnectionString("HallsDatabase")
    ?? throw new InvalidOperationException("ConnectionStrings__HallsDatabase is not configured.");
builder.WebHost.UseUrls(builder.Configuration["Halls:Url"] ?? "http://localhost:5003");
builder.Services.AddDbContext<HallsDbContext>(o => o.UseSqlServer(connection));
builder.Services.AddScoped<IHallService, HallService>();
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p =>
        p.WithOrigins(builder.Configuration["Cors:AllowedOrigin"] ?? "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
    )
);
var app = builder.Build();
using (var scope = app.Services.CreateScope())
    await scope.ServiceProvider.GetRequiredService<HallsDbContext>().Database.EnsureCreatedAsync();
app.UseCors();
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
);
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
);
app.MapDelete(
    "/api/halls/{id:guid}",
    async (Guid id, IHallService service, CancellationToken token) =>
        await service.DeleteAsync(id, token) ? Results.NoContent() : Results.NotFound()
);
app.Run();
