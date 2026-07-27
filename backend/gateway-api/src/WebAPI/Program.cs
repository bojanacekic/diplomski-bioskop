using GatewayApi.Domain.DTOs;
using GatewayApi.Middlewares;
using GatewayApi.Services;
using Yarp.ReverseProxy.Configuration;

DotEnvReader.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var gatewayUrl =
    builder.Configuration["Gateway:Url"]
    ?? builder.Configuration["Gateway__Url"]
    ?? throw new InvalidOperationException("Gateway:Url is not configured.");
var authServiceBaseUrl =
    builder.Configuration["Services:AuthBaseUrl"]
    ?? builder.Configuration["Services__AuthBaseUrl"]
    ?? throw new InvalidOperationException("Services:AuthBaseUrl is not configured.");
var moviesServiceBaseUrl =
    builder.Configuration["Services:MoviesBaseUrl"]
    ?? builder.Configuration["Services__MoviesBaseUrl"]
    ?? throw new InvalidOperationException("Services:MoviesBaseUrl is not configured.");
var hallsServiceBaseUrl =
    builder.Configuration["Services:HallsBaseUrl"]
    ?? builder.Configuration["Services__HallsBaseUrl"]
    ?? throw new InvalidOperationException("Services:HallsBaseUrl is not configured.");
var screeningsServiceBaseUrl =
    builder.Configuration["Services:ScreeningsBaseUrl"]
    ?? builder.Configuration["Services__ScreeningsBaseUrl"]
    ?? throw new InvalidOperationException("Services:ScreeningsBaseUrl is not configured.");
var allowedOrigin =
    builder.Configuration["Cors:AllowedOrigin"]
    ?? builder.Configuration["Cors__AllowedOrigin"]
    ?? throw new InvalidOperationException("Cors:AllowedOrigin is not configured.");
var localLoopbackOrigin = allowedOrigin.Replace(
    "localhost",
    "127.0.0.1",
    StringComparison.OrdinalIgnoreCase
);

builder.WebHost.UseUrls(gatewayUrl);
builder.Services.AddCors(options =>
    options.AddPolicy(
        "Frontend",
        policy =>
            policy.WithOrigins(allowedOrigin, localLoopbackOrigin).AllowAnyHeader().AllowAnyMethod()
    )
);
builder
    .Services.AddReverseProxy()
    .LoadFromMemory(
        [
            new RouteConfig
            {
                RouteId = "auth-route",
                ClusterId = "auth-cluster",
                Match = new RouteMatch { Path = "/api/auth/{**catch-all}" },
            },
            new RouteConfig
            {
                RouteId = "users-route",
                ClusterId = "auth-cluster",
                Match = new RouteMatch { Path = "/api/users/{**catch-all}" },
            },
            new RouteConfig
            {
                RouteId = "movies-route",
                ClusterId = "movies-cluster",
                Match = new RouteMatch { Path = "/api/movies/{**catch-all}" },
            },
            new RouteConfig
            {
                RouteId = "halls-route",
                ClusterId = "halls-cluster",
                Match = new RouteMatch { Path = "/api/halls/{**catch-all}" },
            },
            new RouteConfig
            {
                RouteId = "screenings-route",
                ClusterId = "screenings-cluster",
                Match = new RouteMatch { Path = "/api/screenings/{**catch-all}" },
            },
        ],
        [
            new ClusterConfig
            {
                ClusterId = "auth-cluster",
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["auth-service"] = new() { Address = $"{authServiceBaseUrl.TrimEnd('/')}/" },
                },
            },
            new ClusterConfig
            {
                ClusterId = "movies-cluster",
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["movies-service"] = new()
                    {
                        Address = $"{moviesServiceBaseUrl.TrimEnd('/')}/",
                    },
                },
            },
            new ClusterConfig
            {
                ClusterId = "halls-cluster",
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["halls-service"] = new() { Address = $"{hallsServiceBaseUrl.TrimEnd('/')}/" },
                },
            },
            new ClusterConfig
            {
                ClusterId = "screenings-cluster",
                Destinations = new Dictionary<string, DestinationConfig>
                {
                    ["screenings-service"] = new()
                    {
                        Address = $"{screeningsServiceBaseUrl.TrimEnd('/')}/",
                    },
                },
            },
        ]
    );

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseCors("Frontend");
app.MapGet(
    "/health",
    () =>
        TypedResults.Ok(
            new GatewayHealthResponseDto { Status = "Healthy", CheckedAtUtc = DateTime.UtcNow }
        )
);
app.MapReverseProxy();
app.Run();
