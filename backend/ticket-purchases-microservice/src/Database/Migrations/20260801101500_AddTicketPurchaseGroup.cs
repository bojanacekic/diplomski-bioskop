using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace TicketPurchases.Database.Migrations;

[DbContext(typeof(TicketsDbContext))]
[Migration("20260801101500_AddTicketPurchaseGroup")]
public partial class AddTicketPurchaseGroup : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "PurchaseId",
            table: "TicketPurchases",
            type: "uniqueidentifier",
            nullable: true);
        migrationBuilder.DropIndex(name: "IX_TicketPurchases_PaymentId", table: "TicketPurchases");
        migrationBuilder.CreateIndex(
            name: "IX_TicketPurchases_PaymentId",
            table: "TicketPurchases",
            column: "PaymentId",
            filter: "[PaymentId] IS NOT NULL");
        migrationBuilder.CreateIndex(
            name: "IX_TicketPurchases_PurchaseId",
            table: "TicketPurchases",
            column: "PurchaseId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_TicketPurchases_PurchaseId", table: "TicketPurchases");
        migrationBuilder.DropIndex(name: "IX_TicketPurchases_PaymentId", table: "TicketPurchases");
        migrationBuilder.CreateIndex(
            name: "IX_TicketPurchases_PaymentId",
            table: "TicketPurchases",
            column: "PaymentId",
            unique: true,
            filter: "[PaymentId] IS NOT NULL");
        migrationBuilder.DropColumn(name: "PurchaseId", table: "TicketPurchases");
    }
}
