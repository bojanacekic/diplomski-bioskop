using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TicketPurchases.Database;

#nullable disable

namespace TicketPurchases.Database.Migrations;

[DbContext(typeof(TicketsDbContext))]
[Migration("20260731100000_AddCashPaymentMethod")]
public partial class AddCashPaymentMethod : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "PaymentMethod",
            table: "TicketPurchases",
            type: "int",
            nullable: false,
            defaultValue: 1);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PaymentMethod", table: "TicketPurchases");
    }
}
