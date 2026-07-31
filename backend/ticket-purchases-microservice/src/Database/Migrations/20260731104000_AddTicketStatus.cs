using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TicketPurchases.Database;

#nullable disable

namespace TicketPurchases.Database.Migrations;

[DbContext(typeof(TicketsDbContext))]
[Migration("20260731104000_AddTicketStatus")]
public partial class AddTicketStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Status",
            table: "TicketPurchases",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Valid");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Status", table: "TicketPurchases");
    }
}
