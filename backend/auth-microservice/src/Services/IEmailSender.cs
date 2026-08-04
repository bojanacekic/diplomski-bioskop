namespace AuthMicroservice.Services;

public interface IEmailSender
{
    Task SendAsync(string recipient, string subject, string htmlBody, CancellationToken token);
}
