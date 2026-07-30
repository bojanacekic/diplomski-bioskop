using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TicketPurchases.Database.Migrations;

public partial class AddSeatLabel : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "SeatLabel",
            table: "TicketPurchases",
            type: "nvarchar(10)",
            maxLength: 10,
            nullable: false,
            defaultValue: "");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "SeatLabel", table: "TicketPurchases");
    }
}
