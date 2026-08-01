using System.Text;
using System.Globalization;
using QRCoder;
using TicketPurchases.Domain;

namespace TicketPurchases.Services;

public sealed class TicketPdfService
{
    public byte[] Create(TicketPdfDataDto ticket)
        => CreateDocument(CreateTicketContent(ticket));

    private static string CreateTicketContent(TicketPdfDataDto ticket)
    {
        var screeningTime = DateTime.SpecifyKind(ticket.StartsAtUtc, DateTimeKind.Utc)
            .ToLocalTime()
            .ToString("dd.MM.yyyy. HH:mm");
        var content = new StringBuilder();
        content.AppendLine("0.035 0.075 0.145 rg 0 700 595 142 re f");
        content.AppendLine("1 1 1 rg 38 720 82 82 re f");
        content.AppendLine("q 74 0 0 74 42 724 cm /Logo Do Q");
        AppendText(content, "SMART CINEMA", 142, 774, 25, white: true);
        AppendText(content, "YOUR CINEMA TICKET", 142, 742, 13, white: true);
        AppendText(content, $"TICKET {ticket.TicketNumber}", 42, 660, 11, accent: true);
        AppendText(content, ticket.MovieTitle, 42, 615, 22);
        content.AppendLine("0.88 0.9 0.93 RG 42 590 m 553 590 l S");
        AppendText(content, "DATE AND TIME", 42, 555, 9, accent: true);
        AppendText(content, screeningTime, 42, 532, 14);
        AppendText(content, "HALL", 260, 555, 9, accent: true);
        AppendText(content, ticket.HallName, 260, 532, 14);
        AppendText(content, "SEAT", 430, 555, 9, accent: true);
        AppendText(content, ticket.SeatLabel, 430, 525, 24);
        content.AppendLine("0.965 0.97 0.98 rg 42 425 511 72 re f");
        AppendText(content, "PRICE", 62, 470, 9, accent: true);
        AppendText(content, $"{ticket.PricePaid:0.00} RSD", 62, 445, 15);
        AppendText(content, "PAYMENT", 260, 470, 9, accent: true);
        AppendText(content, ticket.PaymentMethod == PaymentMethod.CashAtBoxOffice ? "Cash at box office" : "Online card", 260, 445, 15);
        AppendText(content, "SCAN AT ENTRANCE", 42, 326, 11, accent: true);
        AppendText(content, "Present this QR code at the cinema entrance.", 42, 302, 11);
        AppendText(content, "This ticket is valid for one entry only.", 42, 282, 10);
        AppendQrCode(content, $"SMART-CINEMA|{ticket.TicketNumber}");
        return content.ToString();
    }

    private static void AppendText(StringBuilder content, string value, int x, int y, int size, bool white = false, bool accent = false)
    {
        content.AppendLine(white ? "1 1 1 rg" : accent ? "0.68 0.39 0.05 rg" : "0.035 0.075 0.145 rg");
        content.AppendLine($"BT /F1 {size} Tf {x} {y} Td ({Escape(value)}) Tj ET");
    }

    public byte[] CreatePurchaseTickets(IReadOnlyList<TicketPdfDataDto> tickets)
    {
        return CreateDocument(tickets.Select(CreateTicketContent));
    }

    public byte[] CreateReceipt(IReadOnlyList<TicketPdfDataDto> tickets)
    {
        const int ticketsPerPage = 10;
        var pages = tickets
            .Chunk(ticketsPerPage)
            .Select((pageTickets, pageIndex) =>
                CreateReceiptContent(pageTickets, tickets, pageIndex + 1, (int)Math.Ceiling((double)tickets.Count / ticketsPerPage))
            );
        return CreateDocument(pages);
    }

    private static string CreateReceiptContent(
        IReadOnlyList<TicketPdfDataDto> pageTickets,
        IReadOnlyList<TicketPdfDataDto> allTickets,
        int pageNumber,
        int pageCount
    )
    {
        var ticket = allTickets[0];
        var purchasedAt = DateTime.SpecifyKind(ticket.PurchasedAtUtc, DateTimeKind.Utc)
            .ToLocalTime()
            .ToString("dd.MM.yyyy. HH:mm");
        var content = new StringBuilder();
        content.AppendLine("0.035 0.075 0.145 rg 0 700 595 142 re f");
        content.AppendLine("1 1 1 rg 38 720 82 82 re f");
        content.AppendLine("q 74 0 0 74 42 724 cm /Logo Do Q");
        AppendText(content, "SMART CINEMA", 142, 774, 25, white: true);
        AppendText(content, "PURCHASE RECEIPT", 142, 742, 13, white: true);
        AppendText(content, $"RECEIPT RC-{ticket.TicketNumber}", 42, 660, 11, accent: true);
        AppendText(content, ticket.MovieTitle, 42, 615, 22);
        content.AppendLine("0.88 0.9 0.93 RG 42 590 m 553 590 l S");
        AppendText(content, "HALL", 42, 555, 9, accent: true);
        AppendText(content, ticket.HallName, 42, 532, 13);
        AppendText(content, "PAYMENT", 235, 555, 9, accent: true);
        AppendText(content, ticket.PaymentMethod == PaymentMethod.CashAtBoxOffice ? "Cash at box office" : "Online card", 235, 532, 13);
        AppendText(content, "PURCHASED", 410, 555, 9, accent: true);
        AppendText(content, purchasedAt, 410, 532, 11);
        content.AppendLine("0.965 0.97 0.98 rg 42 470 511 35 re f");
        AppendText(content, "TICKET NUMBER", 58, 482, 9, accent: true);
        AppendText(content, "SEAT", 365, 482, 9, accent: true);
        AppendText(content, "PRICE", 465, 482, 9, accent: true);
        var y = 445;
        foreach (var item in pageTickets)
        {
            AppendText(content, item.TicketNumber, 58, y, 11);
            AppendText(content, item.SeatLabel, 365, y, 11);
            AppendText(content, $"{item.PricePaid:0.00} RSD", 465, y, 11);
            content.AppendLine($"0.9 0.91 0.93 RG 42 {y - 12} m 553 {y - 12} l S");
            y -= 34;
        }
        if (pageNumber == pageCount)
        {
            content.AppendLine($"0.035 0.075 0.145 rg 330 {Math.Max(80, y - 55)} 223 55 re f");
            AppendText(content, "TOTAL PAID", 350, Math.Max(114, y - 21), 9, white: true);
            AppendText(content, $"{allTickets.Sum(item => item.PricePaid):0.00} RSD", 445, Math.Max(105, y - 30), 16, white: true);
        }
        AppendText(content, $"Page {pageNumber} of {pageCount}", 42, 45, 9, accent: true);
        AppendText(content, "Thank you for choosing Smart Cinema.", 355, 45, 9);
        return content.ToString();
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
        => CreateDocument([content]);

    private static byte[] CreateDocument(IEnumerable<string> pageContents)
    {
        var contents = pageContents.ToArray();
        var pageCount = contents.Length;
        var firstPageObject = 3;
        var firstContentObject = firstPageObject + pageCount;
        var fontObject = firstContentObject + pageCount;
        var logoObject = fontObject + 1;
        var objects = new List<string>
        {
            "<< /Type /Catalog /Pages 2 0 R >>",
            $"<< /Type /Pages /Kids [{string.Join(" ", Enumerable.Range(firstPageObject, pageCount).Select(number => $"{number} 0 R"))}] /Count {pageCount} >>",
        };
        for (var index = 0; index < pageCount; index++)
            objects.Add($"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 {fontObject} 0 R >> /XObject << /Logo {logoObject} 0 R >> >> /Contents {firstContentObject + index} 0 R >>");
        foreach (var content in contents)
            objects.Add($"<< /Length {Encoding.ASCII.GetByteCount(content)} >>\nstream\n{content}endstream");
        objects.Add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
        var logoBytes = File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, "Assets", "smart-cinema-logo.jpg"));
        var logoHex = Convert.ToHexString(logoBytes) + ">";
        objects.Add($"<< /Type /XObject /Subtype /Image /Width 192 /Height 192 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length {logoHex.Length} >>\nstream\n{logoHex}\nendstream");

        using var stream = new MemoryStream();
        using var writer = new StreamWriter(stream, Encoding.ASCII, leaveOpen: true);
        writer.NewLine = "\n";
        writer.Write("%PDF-1.4\n");
        writer.Flush();

        var offsets = new List<long> { 0 };
        for (var index = 0; index < objects.Count; index++)
        {
            offsets.Add(stream.Position);
            writer.Write($"{index + 1} 0 obj\n{objects[index]}\nendobj\n");
            writer.Flush();
        }

        var xrefPosition = stream.Position;
        writer.Write($"xref\n0 {objects.Count + 1}\n");
        writer.Write("0000000000 65535 f \n");
        foreach (var offset in offsets.Skip(1))
            writer.Write($"{offset:D10} 00000 n \n");

        writer.Write(
            $"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xrefPosition}\n%%EOF"
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
