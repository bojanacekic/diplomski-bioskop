using System.Text;
using System.Globalization;
using QRCoder;
using TicketPurchases.Domain;

namespace TicketPurchases.Services;

public sealed class TicketPdfService
{
    public byte[] Create(TicketPdfDataDto ticket)
    {
        var screeningTime = DateTime.SpecifyKind(ticket.StartsAtUtc, DateTimeKind.Utc)
            .ToLocalTime()
            .ToString("dd.MM.yyyy. HH:mm");
        var lines = new[]
        {
            "SMART CINEMA",
            "YOUR CINEMA TICKET",
            $"Ticket number: {ticket.TicketNumber}",
            "",
            $"Movie: {ticket.MovieTitle}",
            $"Hall: {ticket.HallName}",
            $"Screening: {screeningTime}",
            $"Seat: {ticket.SeatLabel}",
            $"Price: {ticket.PricePaid:0.00} RSD",
            $"Purchase: {(ticket.PaymentMethod == PaymentMethod.CashAtBoxOffice ? "Cinema box office - cash" : "Online card payment")}",
            "Scan the QR code at the cinema entrance.",
            "",
            "Please present this ticket at the cinema entrance.",
        };

        var content = new StringBuilder();
        content.AppendLine("BT");
        content.AppendLine("/F1 24 Tf");
        content.AppendLine("60 770 Td");
        content.AppendLine($"({Escape(lines[0])}) Tj");
        content.AppendLine("/F1 14 Tf");
        content.AppendLine("0 -42 Td");
        content.AppendLine($"({Escape(lines[1])}) Tj");
        content.AppendLine("/F1 11 Tf");

        foreach (var line in lines.Skip(2))
        {
            content.AppendLine("0 -28 Td");
            content.AppendLine($"({Escape(line)}) Tj");
        }

        content.AppendLine("ET");
        AppendQrCode(content, $"SMART-CINEMA|{ticket.TicketNumber}");
        return CreateDocument(content.ToString());
    }

    public byte[] CreateReceipt(TicketPdfDataDto ticket)
    {
        var purchasedAt = DateTime.SpecifyKind(ticket.PurchasedAtUtc, DateTimeKind.Utc)
            .ToLocalTime()
            .ToString("dd.MM.yyyy. HH:mm");
        var lines = new[]
        {
            "SMART CINEMA",
            "FISCAL RECEIPT",
            $"Receipt number: RC-{ticket.TicketNumber}",
            $"Ticket number: {ticket.TicketNumber}",
            "",
            $"Movie: {ticket.MovieTitle}",
            $"Hall: {ticket.HallName}",
            $"Seat: {ticket.SeatLabel}",
            $"Payment: {(ticket.PaymentMethod == PaymentMethod.CashAtBoxOffice ? "Cash at box office" : "Online card payment")}",
            $"Total paid: {ticket.PricePaid:0.00} RSD",
            $"Purchased: {purchasedAt}",
        };

        return CreateDocument(CreateTextContent(lines));
    }

    private static string CreateTextContent(IEnumerable<string> lines)
    {
        var content = new StringBuilder();
        var values = lines.ToArray();
        content.AppendLine("BT");
        content.AppendLine("/F1 24 Tf");
        content.AppendLine("60 770 Td");
        content.AppendLine($"({Escape(values[0])}) Tj");
        content.AppendLine("/F1 14 Tf");
        content.AppendLine("0 -42 Td");
        content.AppendLine($"({Escape(values[1])}) Tj");
        content.AppendLine("/F1 11 Tf");
        foreach (var line in values.Skip(2))
        {
            content.AppendLine("0 -28 Td");
            content.AppendLine($"({Escape(line)}) Tj");
        }
        content.AppendLine("ET");
        return content.ToString();
    }

    private static void AppendQrCode(StringBuilder content, string value)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(value, QRCodeGenerator.ECCLevel.Q);
        var modules = data.ModuleMatrix;
        const double size = 130;
        const double left = 405;
        const double bottom = 170;
        var moduleSize = size / modules.Count;

        content.AppendLine("q");
        content.AppendLine("0 g");
        for (var row = 0; row < modules.Count; row++)
        {
            for (var column = 0; column < modules.Count; column++)
            {
                if (!modules[row][column])
                    continue;

                var x = left + column * moduleSize;
                var y = bottom + (modules.Count - row - 1) * moduleSize;
                content.AppendLine(
                    $"{x.ToString("0.###", CultureInfo.InvariantCulture)} {y.ToString("0.###", CultureInfo.InvariantCulture)} {moduleSize.ToString("0.###", CultureInfo.InvariantCulture)} {moduleSize.ToString("0.###", CultureInfo.InvariantCulture)} re f"
                );
            }
        }
        content.AppendLine("Q");
    }

    private static byte[] CreateDocument(string content)
    {
        var contentBytes = Encoding.ASCII.GetBytes(content);
        var objects = new[]
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
            $"<< /Length {contentBytes.Length} >>\nstream\n{content}endstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        };

        using var stream = new MemoryStream();
        using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true);
        writer.NewLine = "\n";
        writer.Write("%PDF-1.4\n");
        writer.Flush();

        var offsets = new List<long> { 0 };
        for (var index = 0; index < objects.Length; index++)
        {
            offsets.Add(stream.Position);
            writer.Write($"{index + 1} 0 obj\n{objects[index]}\nendobj\n");
            writer.Flush();
        }

        var xrefPosition = stream.Position;
        writer.Write($"xref\n0 {objects.Length + 1}\n");
        writer.Write("0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
            writer.Write($"{offset:D10} 00000 n \n");

        writer.Write(
            $"trailer\n<< /Size {objects.Length + 1} /Root 1 0 R >>\nstartxref\n{xrefPosition}\n%%EOF"
        );
        writer.Flush();
        return stream.ToArray();
    }

    private static string Escape(string value) =>
        ToAscii(value)
            .Replace("\\", "\\\\")
            .Replace("(", "\\(")
            .Replace(")", "\\)");

    private static string ToAscii(string value) =>
        value
            .Replace("č", "c")
            .Replace("ć", "c")
            .Replace("š", "s")
            .Replace("ž", "z")
            .Replace("đ", "dj")
            .Replace("Č", "C")
            .Replace("Ć", "C")
            .Replace("Š", "S")
            .Replace("Ž", "Z")
            .Replace("Đ", "Dj");
}
