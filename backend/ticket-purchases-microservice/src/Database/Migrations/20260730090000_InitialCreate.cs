using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketPurchases.Database.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "TicketPurchases",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ReservationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                ScreeningId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                TicketNumber = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                PricePaid = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                PurchasedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
            },
            constraints: table => table.PrimaryKey("PK_TicketPurchases", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_TicketPurchases_ReservationId",
            table: "TicketPurchases",
            column: "ReservationId",
            unique: true);
        migrationBuilder.CreateIndex(
            name: "IX_TicketPurchases_TicketNumber",
            table: "TicketPurchases",
            column: "TicketNumber",
            unique: true);
        migrationBuilder.CreateIndex(
            name: "IX_TicketPurchases_UserId_PurchasedAtUtc",
            table: "TicketPurchases",
            columns: new[] { "UserId", "PurchasedAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "TicketPurchases");
    }
}
