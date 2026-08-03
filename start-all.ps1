$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot

$applications = @(
    @{ Name = "Auth microservice"; Path = "backend\auth-microservice"; Command = "dotnet run --project src/WebAPI/AuthMicroservice.WebAPI.csproj" },
    @{ Name = "Movies microservice"; Path = "backend\movies-microservice"; Command = "dotnet run --project src/WebAPI/Movies.WebAPI.csproj" },
    @{ Name = "Hall management microservice"; Path = "backend\hall-management-microservice"; Command = "dotnet run --project src/WebAPI/Halls.WebAPI.csproj" },
    @{ Name = "Screenings microservice"; Path = "backend\screenings-microservice"; Command = "dotnet run --project src/WebAPI/Screenings.WebAPI.csproj" },
    @{ Name = "Reservations microservice"; Path = "backend\reservations-microservice"; Command = "dotnet run --project src/WebAPI/Reservations.WebAPI.csproj" },
    @{ Name = "Ticket purchases microservice"; Path = "backend\ticket-purchases-microservice"; Command = "dotnet run --project src/WebAPI/TicketPurchases.WebAPI.csproj" },
    @{ Name = "Payments microservice"; Path = "backend\payments-microservice"; Command = "dotnet run --project src/WebAPI/Payments.WebAPI.csproj" },
    @{ Name = "Ratings and recommendations microservice"; Path = "backend\ratings-recommendations-microservice"; Command = "dotnet run --project src/WebAPI/RatingsRecommendations.WebAPI.csproj" },
    @{ Name = "AI support microservice"; Path = "backend\ai-support-microservice"; Command = "dotnet run --project src/WebAPI/AiSupport.WebAPI.csproj" },
    @{ Name = "API Gateway"; Path = "backend\gateway-api"; Command = "dotnet run --project src/WebAPI/GatewayApi.WebAPI.csproj" },
    @{ Name = "React frontend"; Path = "frontend"; Command = "npm run dev" }
)

foreach ($application in $applications) {
    $workingDirectory = Join-Path $projectRoot $application.Path

    Start-Process `
        -FilePath "powershell" `
        -WorkingDirectory $workingDirectory `
        -ArgumentList "-NoExit", "-Command", $application.Command

    Write-Host "Started $($application.Name)."
}

Write-Host "All applications were started in separate PowerShell windows."
