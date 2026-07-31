using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Reservations.Database;

#nullable disable

namespace Reservations.Database.Migrations;

[DbContext(typeof(ReservationsDbContext))]
[Migration("20260731103000_AddReservationExpiry")]
public partial class AddReservationExpiry : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "ExpiredAtUtc",
            table: "Reservations",
            type: "datetime2",
            nullable: true);

        migrationBuilder.DropIndex(
            name: "IX_Reservations_ScreeningId_SeatLabel",
            table: "Reservations");

        migrationBuilder.CreateIndex(
            name: "IX_Reservations_ScreeningId_SeatLabel",
            table: "Reservations",
            columns: new[] { "ScreeningId", "SeatLabel" },
            unique: true,
            filter: "[Status] IN ('Active', 'Confirmed')");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Reservations_ScreeningId_SeatLabel",
            table: "Reservations");

        migrationBuilder.CreateIndex(
            name: "IX_Reservations_ScreeningId_SeatLabel",
            table: "Reservations",
            columns: new[] { "ScreeningId", "SeatLabel" },
            unique: true,
            filter: "[Status] = 'Active'");

        migrationBuilder.DropColumn(name: "ExpiredAtUtc", table: "Reservations");
    }
}
