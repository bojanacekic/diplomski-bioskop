using System.Net.Http.Json;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var serviceUrl = builder.Configuration["AiSupport__Url"] ?? "http://localhost:5009";
var lmStudioUrl = builder.Configuration["LmStudio__Url"] ?? "http://127.0.0.1:1234";
var model = builder.Configuration["LmStudio__Model"] ?? "qwen3-4b-instruct-2507";
const string systemPrompt = """
You are the customer support assistant for Smart Cinema.
Detect the language of every user message. Respond in English to English messages. Respond in Serbian to Serbian messages, using Latin or Cyrillic to match the user. If the language is unclear or mixed, respond in English.
Be concise, friendly, and practical. Keep interface labels such as "My profile", "Reservations", "Download ticket", and "Validate tickets" in English because the application interface is in English.
Only help with Smart Cinema topics: movies, screenings, halls, seats, accounts, reservations, payments, PDF tickets, QR codes, ratings, recommendations, and ticket validation.
Known application behavior:
- Customers can browse active and upcoming movies. An account is required to reserve seats and access personal reservations and tickets.
- A signed-in customer can change their first name, last name, username, and email in "My profile" and save the changes. The new username and email must not already be used by another account.
- A signed-in customer can change their password from the password section in "My profile".
- Smart Cinema contact details: smartcinema2026@gmail.com, +381 21 555 0123, Трг Доситеја Обрадовића 6, Нови Сад 21000, Serbia. Phone support is available every day from 10:00 to 22:00. Cinema opening hours are 10:00 to 23:30.
- Each purchased ticket has its own PDF and unique QR code. Cinema managers and administrators can validate a ticket from "Validate tickets".
- Recommendations are based on genres the signed-in customer has watched and rated.
- Never claim that a reservation, payment, screening, movie, or ticket exists unless that information was supplied in the conversation.
- Never ask for passwords, payment-card details, or complete QR codes.
When live account or schedule data is unavailable, explain where the user can check it in the application. If you do not know an answer, say so instead of inventing it.
""";

builder.WebHost.UseUrls(serviceUrl);
builder.Services.AddHttpClient("LmStudio", client =>
{
    client.BaseAddress = new Uri(lmStudioUrl.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromMinutes(2);
});

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "Healthy", model }));

app.MapPost("/api/support/chat", async (
    ChatRequest request,
    IHttpClientFactory clientFactory,
    CancellationToken cancellationToken) =>
{
    var message = request.Message?.Trim();
    if (string.IsNullOrWhiteSpace(message))
        return Results.BadRequest(new { message = "Please enter a message." });

    if (message.Length > 1000)
        return Results.BadRequest(new { message = "The message must be 1,000 characters or fewer." });

    var messages = new List<object>
    {
        new { role = "system", content = systemPrompt }
    };

    foreach (var item in (request.History ?? []).TakeLast(8))
    {
        if ((item.Role is "user" or "assistant") && !string.IsNullOrWhiteSpace(item.Content))
            messages.Add(new { role = item.Role, content = item.Content.Trim() });
    }
    messages.Add(new { role = "user", content = message });

    try
    {
        var client = clientFactory.CreateClient("LmStudio");
        using var response = await client.PostAsJsonAsync("v1/chat/completions", new
        {
            model,
            messages,
            temperature = 0.25,
            max_tokens = 220,
            stream = false
        }, cancellationToken);

        if (!response.IsSuccessStatusCode)
            return Results.Problem(
                "The AI assistant is temporarily unavailable. Check that the model is loaded in LM Studio.",
                statusCode: StatusCodes.Status503ServiceUnavailable);

        using var document = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken),
            cancellationToken: cancellationToken);
        var reply = document.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return Results.Ok(new { message = reply?.Trim() ?? "I could not generate a response." });
    }
    catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
    {
        return Results.Problem(
            "The AI assistant is offline. Start the Local Server and load Qwen3 in LM Studio.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.Run();

public sealed record ChatRequest(string? Message, IReadOnlyList<ChatHistoryItem>? History);
public sealed record ChatHistoryItem(string Role, string Content);
