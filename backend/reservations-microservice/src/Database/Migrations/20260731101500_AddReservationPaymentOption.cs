using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Reservations.Database;

#nullable disable

namespace Reservations.Database.Migrations;

[DbContext(typeof(ReservationsDbContext))]
[Migration("20260731101500_AddReservationPaymentOption")]
public partial class AddReservationPaymentOption : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "PaymentOption",
            table: "Reservations",
            type: "int",
            nullable: false,
            defaultValue: 0);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PaymentOption", table: "Reservations");
    }
}
