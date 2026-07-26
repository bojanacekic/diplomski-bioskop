using Microsoft.EntityFrameworkCore; using Movies.Database; using Movies.Services;
DotEnvReader.Load();
var builder=WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();
var connection=builder.Configuration.GetConnectionString("MoviesDatabase") ?? builder.Configuration["ConnectionStrings__MoviesDatabase"] ?? throw new InvalidOperationException("ConnectionStrings__MoviesDatabase is not configured.");
builder.WebHost.UseUrls(builder.Configuration["Movies__Url"] ?? "http://localhost:5002"); builder.Services.AddDbContext<MoviesDbContext>(o=>o.UseSqlServer(connection)); builder.Services.AddScoped<IMovieService,MovieService>(); builder.Services.AddCors(o=>o.AddDefaultPolicy(p=>p.WithOrigins(builder.Configuration["Cors__AllowedOrigin"] ?? "http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));
var app=builder.Build(); using(var scope=app.Services.CreateScope()){ await scope.ServiceProvider.GetRequiredService<MoviesDbContext>().Database.EnsureCreatedAsync(); } app.UseCors(); app.MapGet("/api/movies", async (string? search, IMovieService service, CancellationToken token)=>Results.Ok(await service.GetActiveAsync(search,token))); app.Run();
