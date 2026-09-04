FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG SERVICE_DIR
ARG PROJECT_FILE
WORKDIR /src
COPY . .
RUN dotnet restore "${SERVICE_DIR}/src/WebAPI/${PROJECT_FILE}"
RUN dotnet publish "${SERVICE_DIR}/src/WebAPI/${PROJECT_FILE}" -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ARG APP_DLL
ENV ASPNETCORE_ENVIRONMENT=Production
ENV APP_DLL=${APP_DLL}
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["sh", "-c", "dotnet $APP_DLL"]
