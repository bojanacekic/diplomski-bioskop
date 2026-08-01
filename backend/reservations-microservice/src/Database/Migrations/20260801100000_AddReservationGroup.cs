using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Reservations.Database.Migrations;

[DbContext(typeof(ReservationsDbContext))]
[Migration("20260801100000_AddReservationGroup")]
public partial class AddReservationGroup : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "ReservationGroupId",
            table: "Reservations",
            type: "uniqueidentifier",
            nullable: true);
        migrationBuilder.CreateIndex(
            name: "IX_Reservations_ReservationGroupId",
            table: "Reservations",
            column: "ReservationGroupId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Reservations_ReservationGroupId", table: "Reservations");
        migrationBuilder.DropColumn(name: "ReservationGroupId", table: "Reservations");
    }
}
