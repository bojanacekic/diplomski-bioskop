using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketPurchases.Database.Migrations;

public partial class AddPaymentId : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "PaymentId",
            table: "TicketPurchases",
            type: "uniqueidentifier",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_TicketPurchases_PaymentId",
            table: "TicketPurchases",
            column: "PaymentId",
            unique: true,
            filter: "[PaymentId] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_TicketPurchases_PaymentId", table: "TicketPurchases");
        migrationBuilder.DropColumn(name: "PaymentId", table: "TicketPurchases");
    }
}
